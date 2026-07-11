(function (global) {
  "use strict";

  class DuelGameEngine {
    constructor(options) {
      this.config = { ...options.config };
      this.roomId = options.roomId;
      this.questionBank = options.questionBank;
      this.questions = new Map();
      this.families = new Map(this.questionBank.families.map((family) => [family.id, family]));
      this.maxLevel = Math.max(...this.questionBank.levels.map((level) => level.level));
      this.players = new Map();
      this.status = "lobby";
      this.startAt = null;
      this.endedAt = null;
      this.winnerId = null;
      this.lastTickAt = null;
      this.targetCursor = 0;
      this.eliminationCounter = 0;

      this.questionBank.levels.forEach((level) => {
        level.questions.forEach((question) => this.questions.set(question.id, question));
      });
    }

    addPlayer(playerData) {
      if (this.players.has(playerData.id)) {
        const existing = this.players.get(playerData.id);
        existing.name = playerData.name || existing.name;
        existing.connected = playerData.connected !== false;
        return existing;
      }

      const player = {
        id: playerData.id,
        name: playerData.name,
        seat: playerData.seat || this.players.size + 1,
        connected: playerData.connected !== false,
        alive: true,
        timeMs: this.config.initialTimeSeconds * 1000,
        level: 1,
        queue: [],
        current: null,
        penalties: [],
        lastQuestionId: null,
        eliminatedAt: null,
        eliminationOrder: null,
        stats: {
          correct: 0,
          wrong: 0,
          attacksSent: 0
        }
      };

      this.players.set(player.id, player);
      return player;
    }

    removePlayer(playerId) {
      if (this.status !== "lobby") {
        return false;
      }
      return this.players.delete(playerId);
    }

    setPlayerConnection(playerId, connected) {
      const player = this.players.get(playerId);
      if (player) {
        player.connected = connected;
      }
    }

    getLobbyState() {
      return {
        roomId: this.roomId,
        config: this.config,
        expectedPlayers: this.config.playerCount,
        players: this.sortedPlayers().map((player) => ({
          id: player.id,
          name: player.name,
          seat: player.seat,
          connected: player.connected
        }))
      };
    }

    canStart() {
      const players = this.sortedPlayers();
      return players.length === this.config.playerCount && players.every((player) => player.connected);
    }

    start(startAt) {
      if (!this.canStart() || this.status !== "lobby") {
        return false;
      }

      this.status = "countdown";
      this.startAt = startAt;
      this.lastTickAt = startAt;
      this.winnerId = null;
      this.endedAt = null;
      this.eliminationCounter = 0;

      const usedQuestionIds = new Set();
      this.sortedPlayers().forEach((player) => {
        player.alive = true;
        player.timeMs = this.config.initialTimeSeconds * 1000;
        player.level = 1;
        player.queue = [];
        player.current = null;
        player.penalties = [];
        player.lastQuestionId = null;
        player.eliminatedAt = null;
        player.eliminationOrder = null;
        player.stats = { correct: 0, wrong: 0, attacksSent: 0 };

        const question = this.pickQuestion(1, player.lastQuestionId, usedQuestionIds);
        if (question) {
          usedQuestionIds.add(question.id);
          player.current = this.activateItem({ questionId: question.id });
          player.lastQuestionId = question.id;
        }
      });

      return true;
    }

    tick(now) {
      if (this.status === "countdown") {
        if (now < this.startAt) {
          return false;
        }
        this.status = "playing";
        this.lastTickAt = this.startAt;
      }

      if (this.status !== "playing") {
        return false;
      }

      let remaining = Math.max(0, now - this.lastTickAt);
      let simulatedNow = this.lastTickAt;
      this.lastTickAt = now;
      let changed = false;

      while (remaining > 0 && this.status === "playing") {
        const alivePlayers = this.sortedPlayers().filter((player) => player.alive);
        const rates = new Map(alivePlayers.map((player) => [player.id, 1 + this.getPenaltyRate(player)]));
        const nextExpiry = Math.min(
          ...alivePlayers.map((player) => player.timeMs / rates.get(player.id))
        );
        const step = Math.min(remaining, nextExpiry);

        alivePlayers.forEach((player) => {
          player.timeMs = Math.max(0, player.timeMs - step * rates.get(player.id));
        });
        simulatedNow += step;
        remaining -= step;

        const expiredPlayers = alivePlayers.filter((player) => player.timeMs <= 0.0001);
        if (!expiredPlayers.length) {
          break;
        }

        for (const player of expiredPlayers) {
          if (this.status !== "playing") break;
          this.eliminatePlayer(player.id, simulatedNow);
          changed = true;
        }
      }

      return changed;
    }

    processAnswer(playerId, instanceId, optionId, now) {
      if (this.status !== "playing") {
        return { accepted: false, reason: "La partida todavía no está activa." };
      }

      const player = this.players.get(playerId);
      if (!player || !player.alive || !player.current) {
        return { accepted: false, reason: "No hay una pregunta activa." };
      }

      if (player.current.instanceId !== instanceId) {
        return { accepted: false, reason: "La pregunta ya ha cambiado." };
      }

      const current = player.current;
      const question = this.questions.get(current.questionId);
      const correct = current.correctOptionId === optionId;
      let removedPenalty = null;
      let attack = null;

      if (correct) {
        player.stats.correct += 1;
        player.timeMs += this.config.bonusSeconds * 1000;
        player.level = Math.min(this.maxLevel, player.level + 1);

        if (current.penaltyId) {
          removedPenalty = player.penalties.find((penalty) => penalty.id === current.penaltyId) || null;
          player.penalties = player.penalties.filter((penalty) => penalty.id !== current.penaltyId);
        }

        attack = this.createAttack(player, question);
      } else {
        player.stats.wrong += 1;
        if (current.penaltyId) {
          player.queue.push({
            queueId: current.queueId,
            questionId: current.questionId,
            penaltyId: current.penaltyId,
            penaltyAmount: current.penaltyAmount,
            sourcePlayerId: current.sourcePlayerId
          });
        }
      }

      player.current = null;
      this.loadNextQuestion(player);

      return {
        accepted: true,
        correct,
        playerId,
        bonusSeconds: correct ? this.config.bonusSeconds : 0,
        removedPenalty,
        attack,
        level: player.level,
        answeredAt: now
      };
    }

    createAttack(sourcePlayer, sourceQuestion) {
      const targets = this.sortedPlayers().filter((player) => player.alive && player.id !== sourcePlayer.id);
      if (!targets.length) {
        return null;
      }

      const target = targets[this.targetCursor % targets.length];
      this.targetCursor = (this.targetCursor + 1) % Math.max(1, targets.length);
      const inverseQuestion = this.questions.get(sourceQuestion.inverseQuestionId);
      if (!inverseQuestion) {
        return null;
      }

      const penaltyAmount = this.config.penaltyEpsilon * sourceQuestion.weight;
      const penaltyId = createId("penalty");
      const queueId = createId("queue");
      const queueItem = {
        queueId,
        questionId: inverseQuestion.id,
        penaltyId,
        penaltyAmount,
        sourcePlayerId: sourcePlayer.id
      };

      target.queue.push(queueItem);
      target.penalties.push({
        id: penaltyId,
        amount: penaltyAmount,
        queueId,
        questionId: inverseQuestion.id,
        sourcePlayerId: sourcePlayer.id
      });
      sourcePlayer.stats.attacksSent += 1;

      return {
        sourcePlayerId: sourcePlayer.id,
        sourceName: sourcePlayer.name,
        targetPlayerId: target.id,
        targetName: target.name,
        questionId: inverseQuestion.id,
        penaltyAmount
      };
    }

    loadNextQuestion(player) {
      let item = null;
      if (player.queue.length) {
        item = player.queue.shift();
      } else {
        const question = this.pickQuestion(player.level, player.lastQuestionId);
        if (question) {
          item = { questionId: question.id };
        }
      }

      if (!item) {
        player.current = null;
        return;
      }

      player.current = this.activateItem(item);
      player.lastQuestionId = item.questionId;
    }

    activateItem(item) {
      const question = this.questions.get(item.questionId);
      if (!question) {
        return null;
      }

      const optionValues = shuffle([question.correctAnswer, ...question.incorrectAnswers]);
      const options = optionValues.map((latex) => ({ id: createId("option"), latex }));
      const correctOption = options.find((option) => option.latex === question.correctAnswer);

      return {
        instanceId: createId("question"),
        queueId: item.queueId || createId("queue"),
        questionId: question.id,
        penaltyId: item.penaltyId || null,
        penaltyAmount: item.penaltyAmount || 0,
        sourcePlayerId: item.sourcePlayerId || null,
        options,
        correctOptionId: correctOption.id
      };
    }

    pickQuestion(level, lastQuestionId, excludedIds) {
      const selectedFamilies = new Set(this.config.families);
      const all = Array.from(this.questions.values()).filter((question) => selectedFamilies.has(question.family));
      const availableLevels = Array.from(new Set(all.map((question) => question.level))).sort((a, b) => a - b);
      const preferredLevels = [
        level,
        ...availableLevels.filter((value) => value < level).sort((a, b) => b - a),
        ...availableLevels.filter((value) => value > level).sort((a, b) => a - b)
      ];

      for (const preferredLevel of preferredLevels) {
        let candidates = all.filter((question) => question.level === preferredLevel);
        const withoutLast = candidates.filter((question) => question.id !== lastQuestionId);
        if (withoutLast.length) {
          candidates = withoutLast;
        }
        if (excludedIds) {
          const withoutExcluded = candidates.filter((question) => !excludedIds.has(question.id));
          if (withoutExcluded.length) {
            candidates = withoutExcluded;
          }
        }
        if (candidates.length) {
          return candidates[Math.floor(Math.random() * candidates.length)];
        }
      }

      return null;
    }

    eliminatePlayer(playerId, now) {
      const player = this.players.get(playerId);
      if (!player || !player.alive || this.status !== "playing") {
        return;
      }

      const transferable = [];
      if (player.current && player.current.penaltyId) {
        transferable.push({
          queueId: player.current.queueId,
          questionId: player.current.questionId,
          penaltyId: player.current.penaltyId,
          penaltyAmount: player.current.penaltyAmount,
          sourcePlayerId: player.current.sourcePlayerId
        });
      }
      player.queue.forEach((item) => {
        if (item.penaltyId) {
          transferable.push({ ...item });
        }
      });

      player.alive = false;
      player.timeMs = 0;
      player.current = null;
      player.queue = [];
      player.penalties = [];
      player.eliminatedAt = now;
      this.eliminationCounter += 1;
      player.eliminationOrder = this.eliminationCounter;

      const survivors = this.sortedPlayers().filter((candidate) => candidate.alive);
      transferable.forEach((item, index) => {
        if (!survivors.length) {
          return;
        }
        const target = survivors[(this.targetCursor + index) % survivors.length];
        target.queue.push(item);
        target.penalties.push({
          id: item.penaltyId,
          amount: item.penaltyAmount,
          queueId: item.queueId,
          questionId: item.questionId,
          sourcePlayerId: item.sourcePlayerId
        });
      });
      if (survivors.length) {
        this.targetCursor = (this.targetCursor + transferable.length) % survivors.length;
      }

      if (survivors.length <= 1) {
        this.status = "finished";
        this.endedAt = now;
        this.winnerId = survivors.length ? survivors[0].id : null;
      }
    }

    getPenaltyRate(player) {
      const total = player.penalties.reduce((sum, penalty) => sum + penalty.amount, 0);
      return Math.min(this.config.penaltyCap, total);
    }

    snapshotFor(playerId, now) {
      const player = this.players.get(playerId);
      const players = this.sortedPlayers().map((candidate) => this.publicPlayer(candidate));

      return {
        type: "game-state",
        serverNow: now,
        roomId: this.roomId,
        status: this.status,
        startAt: this.startAt,
        endedAt: this.endedAt,
        winnerId: this.winnerId,
        config: this.config,
        me: player ? this.privatePlayer(player) : null,
        players,
        results: this.status === "finished" ? this.buildResults() : []
      };
    }

    publicPlayer(player) {
      return {
        id: player.id,
        name: player.name,
        seat: player.seat,
        connected: player.connected,
        alive: player.alive,
        timeMs: player.timeMs,
        level: player.level,
        penaltyRate: this.getPenaltyRate(player),
        queueLength: player.queue.length,
        stats: { ...player.stats },
        eliminatedAt: player.eliminatedAt,
        eliminationOrder: player.eliminationOrder
      };
    }

    privatePlayer(player) {
      const publicData = this.publicPlayer(player);
      const current = player.current ? this.privateQuestion(player.current) : null;
      return {
        ...publicData,
        current,
        penalties: player.penalties.map((penalty) => {
          const source = this.players.get(penalty.sourcePlayerId);
          const question = this.questions.get(penalty.questionId);
          return {
            id: penalty.id,
            amount: penalty.amount,
            sourcePlayerId: penalty.sourcePlayerId,
            sourceName: source ? source.name : "Jugador eliminado",
            questionId: penalty.questionId,
            family: question ? question.family : null
          };
        })
      };
    }

    privateQuestion(current) {
      const question = this.questions.get(current.questionId);
      const source = current.sourcePlayerId ? this.players.get(current.sourcePlayerId) : null;
      const family = question ? this.families.get(question.family) : null;
      return {
        instanceId: current.instanceId,
        questionId: current.questionId,
        operation: question.operation,
        prompt: question.prompt,
        expression: question.expression,
        family: question.family,
        familyLabel: family ? family.label : question.family,
        level: question.level,
        weight: question.weight,
        options: current.options.map((option) => ({ ...option })),
        penaltyId: current.penaltyId,
        penaltyAmount: current.penaltyAmount,
        sourcePlayerId: current.sourcePlayerId,
        sourceName: source ? source.name : null
      };
    }

    buildResults() {
      return this.sortedPlayers()
        .slice()
        .sort((first, second) => {
          if (first.id === this.winnerId) return -1;
          if (second.id === this.winnerId) return 1;
          return (second.eliminationOrder || 0) - (first.eliminationOrder || 0);
        })
        .map((player, index) => ({
          position: index + 1,
          id: player.id,
          name: player.name,
          level: player.level,
          timeMs: player.timeMs,
          stats: { ...player.stats }
        }));
    }

    sortedPlayers() {
      return Array.from(this.players.values()).sort((first, second) => first.seat - second.seat);
    }
  }

  function shuffle(values) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function createId(prefix) {
    const random = global.crypto && global.crypto.getRandomValues
      ? Array.from(global.crypto.getRandomValues(new Uint32Array(2)), (value) => value.toString(36)).join("")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `${prefix}-${random.slice(0, 16)}`;
  }

  global.DuelGameEngine = DuelGameEngine;
})(window);
