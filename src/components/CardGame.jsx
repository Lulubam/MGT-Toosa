import React, { useState, useEffect } from 'react';

const CardGame = () => {
  // Game state
  const [gameState, setGameState] = useState('setup');
  const [players, setPlayers] = useState([
    { id: 1, name: 'Player 1', cards: [], points: 0, isDealer: false, optedOut: false, rings: { gold: 0, platinum: 0 } },
    { id: 2, name: 'Player 2', cards: [], points: 0, isDealer: false, optedOut: false, rings: { gold: 0, platinum: 0 } },
    { id: 3, name: 'Player 3', cards: [], points: 0, isDealer: false, optedOut: false, rings: { gold: 0, platinum: 0 } },
    { id: 4, name: 'Player 4', cards: [], points: 0, isDealer: false, optedOut: false, rings: { gold: 0, platinum: 0 } }
  ]);
  const [deck, setDeck] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dealerChoice, setDealerChoice] = useState('');
  const [flushCount, setFlushCount] = useState(3);
  const [direction, setDirection] = useState('clockwise');
  const [callingCard, setCallingCard] = useState(null);
  const [roundCards, setRoundCards] = useState([]);
  const [message, setMessage] = useState('Welcome! Set up the game to begin.');
  const [flushedCards, setFlushedCards] = useState([]);

  // UI States
  const [showAllCards, setShowAllCards] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  // Dealing
  const [manualDealing, setManualDealing] = useState(false);
  const [currentDealPlayer, setCurrentDealPlayer] = useState(0);
  const [dealRound, setDealRound] = useState(0);
  const [currentRoundCardCount, setCurrentRoundCardCount] = useState(0);
  const [cardsPerRound] = useState([3, 2]);

  // Dealer selection
  const [dealerSelectionPhase, setDealerSelectionPhase] = useState(true);
  const [dealerSelectionCards, setDealerSelectionCards] = useState([]);

  // Create deck
  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '3', '4', '5', '6', '7', '8', '9', '10'];
    const newDeck = [];

    suits.forEach(suit => {
      ranks.forEach(rank => {
        newDeck.push({
          suit,
          rank,
          value: getCardValue(rank, suit),
          id: `${rank}-${suit}`
        });
      });
    });

    return shuffleDeck(newDeck);
  };

  const getCardValue = (rank, suit) => {
    if (rank === '3' && suit === '♠') return 12;
    if (rank === '3') return 6;
    if (rank === '4') return 4;
    if (rank === 'A') return 2;
    return 1;
  };

  const getCardNumber = (rank) => {
    if (rank === 'A') return 1;
    if (rank === '3') return 3;
    if (rank === '4') return 4;
    return parseInt(rank) || 0;
  };

  const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const initializeGame = () => {
    const newDeck = createDeck();
    setDeck(newDeck);
    setDealerSelectionPhase(true);

    const selectionCards = [];
    for (let i = 0; i < players.length; i++) {
      selectionCards.push({
        playerId: i,
        card: newDeck[i]
      });
    }

    setDealerSelectionCards(selectionCards);
    setMessage('Each player has drawn a card. Click "Determine Dealer" to see who deals first.');
  };

  const determineDealerFromCards = (useHighest = true) => {
    let dealerCard = dealerSelectionCards[0];

    for (let selection of dealerSelectionCards) {
      if (useHighest) {
        if (getCardNumber(selection.card.rank) > getCardNumber(dealerCard.card.rank)) {
          dealerCard = selection;
        }
      } else {
        if (getCardNumber(selection.card.rank) < getCardNumber(dealerCard.card.rank)) {
          dealerCard = selection;
        }
      }
    }

    const newPlayers = [...players];
    newPlayers.forEach(p => p.isDealer = false);
    newPlayers[dealerCard.playerId].isDealer = true;
    setPlayers(newPlayers);
    setCurrentPlayer(dealerCard.playerId);
    setDealerSelectionPhase(false);
    setGameState('dealing');
    setMessage(`${newPlayers[dealerCard.playerId].name} deals first! (Drew ${dealerCard.card.rank}${dealerCard.card.suit})`);
  };

  const dealCards = () => {
    if (!dealerChoice) return;

    let cardIndex = 0;
    const newFlushedCards = [];

    if (dealerChoice === 'flush') {
      for (let i = 0; i < flushCount; i++) {
        newFlushedCards.push(deck[cardIndex]);
        cardIndex++;
      }
      setFlushedCards(newFlushedCards);
    }

    const dealerIndex = players.findIndex(p => p.isDealer);
    const firstPlayerToDeal = direction === 'clockwise'
      ? (dealerIndex + 1) % players.length
      : (dealerIndex - 1 + players.length) % players.length;

    setManualDealing(true);
    setCurrentDealPlayer(firstPlayerToDeal);
    setDealRound(0);
    setCurrentRoundCardCount(0);
    setDeck(deck.slice(cardIndex));
    setMessage(`Manual dealing started. Dealing ${cardsPerRound[0]} cards in round 1. Click "Deal Card" to give cards one by one.`);
  };

  const dealSingleCard = (targetPlayerId = null) => {
    if (!manualDealing || deck.length === 0) return;

    const newPlayers = [...players];
    const playerToReceive = targetPlayerId !== null ? targetPlayerId : currentDealPlayer;

    if (targetPlayerId !== null && playerToReceive !== currentDealPlayer) {
      const dealerIndex = players.findIndex(p => p.isDealer);
      newPlayers[dealerIndex].points += 2;
      setPlayers(newPlayers);
      setMessage(`Foul! Dealer dealt to wrong player (+2 points)`);
      return;
    }

    newPlayers[playerToReceive].cards.push(deck[0]);
    setPlayers(newPlayers);
    setDeck(deck.slice(1));

    let nextPlayer = currentDealPlayer;
    let nextRound = dealRound;
    let nextCardCount = currentRoundCardCount + 1;

    if (nextCardCount >= cardsPerRound[dealRound]) {
      nextPlayer = direction === 'clockwise'
        ? (currentDealPlayer + 1) % players.length
        : (currentDealPlayer - 1 + players.length) % players.length;

      while (players[nextPlayer].optedOut && nextPlayer !== players.findIndex(p => p.isDealer)) {
        nextPlayer = direction === 'clockwise'
          ? (nextPlayer + 1) % players.length
          : (nextPlayer - 1 + players.length) % players.length;
      }

      nextCardCount = 0;

      const dealerIndex = players.findIndex(p => p.isDealer);
      if (nextPlayer === dealerIndex && currentDealPlayer !== dealerIndex) {
        // Continue
      } else if (currentDealPlayer === dealerIndex) {
        nextRound++;
        if (nextRound < cardsPerRound.length) {
          nextPlayer = direction === 'clockwise'
            ? (dealerIndex + 1) % players.length
            : (dealerIndex - 1 + players.length) % players.length;
          while (players[nextPlayer].optedOut) {
            nextPlayer = direction === 'clockwise'
              ? (nextPlayer + 1) % players.length
              : (nextPlayer - 1 + players.length) % players.length;
          }
        }
      }
    } else {
      nextPlayer = currentDealPlayer;
    }

    setCurrentDealPlayer(nextPlayer);
    setDealRound(nextRound);
    setCurrentRoundCardCount(nextCardCount);

    if (nextRound >= cardsPerRound.length) {
      setManualDealing(false);
      setGameState('playing');
      const dealerIndex = players.findIndex(p => p.isDealer);
      const firstPlayer = direction === 'clockwise'
        ? (dealerIndex + 1) % players.length
        : (dealerIndex - 1 + players.length) % players.length;
      setCurrentPlayer(firstPlayer);
      setMessage(`Cards dealt! ${players[firstPlayer].name} starts the round by playing the calling card.`);
    } else {
      setMessage(`Dealing round ${nextRound + 1}/${cardsPerRound.length} (${cardsPerRound[nextRound]} cards). Next card to: ${players[nextPlayer].name} (Card ${nextCardCount + 1}/${cardsPerRound[nextRound]})`);
    }
  };

  const playCard = (playerId, cardIndex) => {
    if (playerId !== currentPlayer || players[playerId].optedOut) return;

    const player = players[playerId];
    const card = player.cards[cardIndex];

    if (callingCard && card.suit !== callingCard.suit) {
      const hasCallingCardSuit = player.cards.some(c => c.suit === callingCard.suit);
      if (hasCallingCardSuit) {
        const newPlayers = [...players];
        newPlayers[playerId].points += 2;
        setPlayers(newPlayers);
        setMessage(`Foul! Must follow suit (+2 points)`);
        return;
      }
    }

    const newPlayers = [...players];
    const playedCard = newPlayers[playerId].cards.splice(cardIndex, 1)[0];
    const newRoundCards = [...roundCards, { card: playedCard, playerId }];

    setRoundCards(newRoundCards);
    if (!callingCard) setCallingCard(playedCard);
    setPlayers(newPlayers);

    let nextPlayer = direction === 'clockwise'
      ? (currentPlayer + 1) % players.length
      : (currentPlayer - 1 + players.length) % players.length;

    while (players[nextPlayer].optedOut && newRoundCards.length < players.filter(p => !p.optedOut).length) {
      nextPlayer = direction === 'clockwise'
        ? (nextPlayer + 1) % players.length
        : (nextPlayer - 1 + players.length) % players.length;
    }

    setCurrentPlayer(nextPlayer);

    if (newRoundCards.length === players.filter(p => !p.optedOut).length) {
      endRound(newRoundCards);
    }
  };

  const endRound = (roundCards) => {
    const callingCardSuit = callingCard.suit;
    const callingCardPlays = roundCards.filter(rc => rc.card.suit === callingCardSuit);
    let winner = callingCardPlays.length > 0
      ? callingCardPlays.reduce((prev, curr) =>
          getCardNumber(curr.card.rank) > getCardNumber(prev.card.rank) ? curr : prev
        )
      : roundCards[0];

    setCurrentPlayer(winner.playerId);

    const activePlayers = players.filter(p => !p.optedOut);
    const allCardsPlayed = activePlayers.every(p => p.cards.length === 0);

    if (allCardsPlayed) {
      handleEndOfRound(winner);
    } else {
      setCallingCard(null);
      setRoundCards([]);
      setMessage(`${players[winner.playerId].name} wins the trick and leads next!`);
    }
  };

  const handleEndOfRound = (winner) => {
    const attackCard = winner.card;
    const attackValue = attackCard.value;

    let nextPlayerId = direction === 'clockwise'
      ? (winner.playerId + 1) % players.length
      : (winner.playerId - 1 + players.length) % players.length;

    while (players[nextPlayerId].optedOut) {
      nextPlayerId = direction === 'clockwise'
        ? (nextPlayerId + 1) % players.length
        : (nextPlayerId - 1 + players.length) % players.length;
    }

    const newPlayers = [...players];
    newPlayers[nextPlayerId].points += attackValue;

    if (newPlayers[winner.playerId].points === 0) {
      const activePlayers = newPlayers.filter(p => !p.optedOut);
      if (activePlayers.length === 2) {
        newPlayers[winner.playerId].rings.platinum++;
        setMessage(`🏆 PLATINUM RING! ${newPlayers[winner.playerId].name} wins with 0 points!`);
      } else {
        newPlayers[winner.playerId].rings.gold++;
        setMessage(`🥇 GOLD RING! ${newPlayers[winner.playerId].name} wins with 0 points!`);
      }
    }

    if (newPlayers[nextPlayerId].points >= 12) {
      newPlayers[nextPlayerId].optedOut = true;
      setMessage(`Round over! ${newPlayers[nextPlayerId].name} is knocked out with ${newPlayers[nextPlayerId].points} points! ${newPlayers[winner.playerId].name} deals next round.`);
    } else {
      setMessage(`Round over! ${newPlayers[nextPlayerId].name} takes ${attackValue} damage (${newPlayers[nextPlayerId].points} total points). ${newPlayers[winner.playerId].name} deals next round.`);
    }

    newPlayers.forEach(p => p.isDealer = false);
    newPlayers[winner.playerId].isDealer = true;
    setPlayers(newPlayers);

    setCallingCard(null);
    setRoundCards([]);
    setFlushedCards([]);

    const activePlayers = newPlayers.filter(p => !p.optedOut);
    if (activePlayers.length <= 1) {
      setGameState('game-end');
      setMessage(activePlayers.length === 1 ? `${activePlayers[0].name} wins the game!` : 'Game over - no players remaining!');
    } else {
      setTimeout(() => startNewRound(), 3000);
    }
  };

  const startNewRound = () => {
    const newDeck = createDeck();
    setDeck(newDeck);
    setGameState('dealing');
    setCallingCard(null);
    setRoundCards([]);
    setDealerChoice('');
    setFlushedCards([]);
    setManualDealing(false);
    setCurrentDealPlayer(0);
    setDealRound(0);
    setCurrentRoundCardCount(0);

    const newPlayers = [...players];
    newPlayers.forEach(player => {
      if (!player.optedOut) player.cards = [];
    });
    setPlayers(newPlayers);

    const dealerIndex = players.findIndex(p => p.isDealer);
    setCurrentPlayer(dealerIndex);
  };

  // Card Component
  const Card = ({ card, onClick, disabled = false }) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const color = isRed ? '#dc2626' : '#000000';

    return (
      <div
        onClick={!disabled ? onClick : undefined}
        className={`relative w-16 h-24 rounded-lg border-2 border-gray-400 bg-white shadow-lg cursor-pointer transform transition-all duration-200 ${!disabled ? 'hover:scale-105 hover:shadow-xl' : ''}`}
      >
        {/* Top Left Corner */}
        <div className="absolute top-1 left-1 text-xs font-bold" style={{ color }}>
          {card.suit}
        </div>
        
        {/* Center Suit */}
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold" style={{ color }}>
          {card.suit}
        </div>
        
        {/* Bottom Right Corner (rotated) */}
        <div className="absolute bottom-1 right-1 text-xs font-bold transform rotate-180" style={{ color }}>
          {card.suit}
        </div>
      </div>
    );
  };

  const CardBack = () => (
    <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 border-2 border-blue-700 shadow-lg flex items-center justify-center">
      <span className="text-white text-xs font-bold">BACK</span>
    </div>
  );

  const PlayerHand = ({ player, playCard, currentPlayer }) => {
    const isTurn = player.id - 1 === currentPlayer;
    return (
      <div className={`player-hand ${isTurn ? 'current-turn-glow' : ''}`}>
        <div className="player-info">
          <h4 className="font-bold text-white">
            {player.name} {player.isDealer && '👑'}
          </h4>
          <p className="text-sm text-yellow-300">Points: {player.points}</p>
        </div>
        <div className="flex gap-1">
          {showAllCards || player.id === 1
            ? player.cards.map((card, i) => (
                <Card key={i} card={card} onClick={() => isTurn && playCard(player.id - 1, i)} disabled={!isTurn} />
              ))
            : player.cards.map((_, i) => <CardBack key={i} />)
          }
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-700/80 to-green-800/80 backdrop-blur-md rounded-2xl p-6 mb-6 border border-green-600/30 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-xl border-2 border-gray-300 flex items-center justify-center shadow-lg">
                  <span className="text-black font-bold text-xl">♠</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Elite Card Game</h1>
                <p className="text-green-100 text-sm">{message}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAllCards(!showAllCards)}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                title={showAllCards ? "Hide all cards" : "Show all cards (Debug)"}
              >
                {showAllCards ? <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.028m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
              </button>

              {!roomCode ? (
                <button
                  onClick={() => setRoomCode(generateRoomCode())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Create Room
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-white/10 rounded-lg text-white font-mono text-sm">
                    Room: {roomCode}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(`Join my card game! Room code: ${roomCode}`)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => setRoomCode('')}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Leave
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Setup */}
        {gameState === 'setup' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Game Setup</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Game Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
                  >
                    <option value="clockwise">Clockwise</option>
                    <option value="anticlockwise">Anticlockwise</option>
                  </select>
                </div>
                <button
                  onClick={initializeGame}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 010 5H9v-5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Draw Cards for Dealer
                </button>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-bold mb-2">Game Rules</h3>
                <ul className="text-green-100 text-sm space-y-1">
                  <li>• Deck: No 2s, J, Q, K, Jokers</li>
                  <li>• Dealing: 3 then 2 cards</li>
                  <li>• Follow suit if possible</li>
                  <li>• 12+ points = knocked out</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Dealer Selection */}
        {dealerSelectionPhase && dealerSelectionCards.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Dealer Selection</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {dealerSelectionCards.map((selection, i) => (
                <div key={i} className="text-center space-y-3">
                  <div className="text-white font-semibold">{players[selection.playerId].name}</div>
                  <Card card={selection.card} disabled={true} />
                </div>
              ))}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => determineDealerFromCards(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Highest Card Deals
              </button>
              <button
                onClick={() => determineDealerFromCards(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lowest Card Deals
              </button>
            </div>
          </div>
        )}

        {/* Dealing Phase */}
        {gameState === 'dealing' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Dealer's Choice</h2>
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setDealerChoice('straight')}
                className={`px-6 py-3 rounded-lg ${dealerChoice === 'straight' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
              >
                Serve Straight
              </button>
              <button
                onClick={() => setDealerChoice('flush')}
                className={`px-6 py-3 rounded-lg ${dealerChoice === 'flush' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
              >
                Flush Cards
              </button>
              {dealerChoice === 'flush' && (
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={flushCount}
                  onChange={(e) => setFlushCount(e.target.value)}
                  className="w-16 px-2 py-2 bg-white/20 text-white text-center border border-white/20"
                />
              )}
            </div>
            {dealerChoice && !manualDealing && (
              <button
                onClick={dealCards}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Start Manual Dealing
              </button>
            )}

            {/* This is the new button for dealing single cards */}
            {dealerChoice && manualDealing && (
              <button
                onClick={() => dealSingleCard()}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 mt-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                Deal Card to {players[currentDealPlayer]?.name}
              </button>
            )}
          </div>
        )}

        {/* Main Table */}
        <div className="table-container">
          {players.map((player, i) => (
            !player.optedOut && (
              <div key={player.id} className={`player-area ${['bottom', 'left', 'top', 'right'][i]}`}>
                <PlayerHand player={player} playCard={playCard} currentPlayer={currentPlayer} />
              </div>
            )
          ))}

          <div className="center-area">
            {flushedCards.length > 0 && (
              <div className="flushed-cards">
                <h3 className="text-white text-sm">Flushed</h3>
                <div className="flex gap-1">
                  {flushedCards.map((c, i) => (
                    <Card key={i} card={c} disabled={true} />
                  ))}
                </div>
              </div>
            )}
            {roundCards.length > 0 && (
              <div className="round-cards">
                <h3 className="text-white text-sm">Current Trick</h3>
                <div className="flex gap-1">
                  {roundCards.map((rc, i) => (
                    <div key={i} className="text-center">
                      <Card card={rc.card} disabled={true} />
                      <p className="text-xs text-green-200">{players[rc.playerId].name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CardGame;
