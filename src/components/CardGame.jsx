import React, { useState } from 'react';

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

  // Fixed Card Component
  const Card = ({ card, onClick, disabled = false }) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const color = isRed ? '#dc2626' : '#000000';

    return (
      <div
        onClick={!disabled ? onClick : undefined}
        className={`relative w-16 h-24 rounded-lg border-2 border-gray-400 bg-white shadow-lg ${!disabled ? 'cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl' : ''}`}
      >
        <div className="absolute top-1 left-1 text-xs font-bold" style={{ color }}>
          {card.rank}
          <br />
          <span className="text-sm">{card.suit}</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold" style={{ color }}>
          {card.suit}
        </div>
        <div className="absolute bottom-1 right-1 text-xs font-bold transform rotate-180" style={{ color }}>
          {card.rank}
          <br />
          <span className="text-sm transform rotate-180">{card.suit}</span>
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
      <div className={`p-4 rounded-lg border-2 ${isTurn ? 'border-yellow-400 bg-yellow-400/20' : 'border-white/30 bg-white/10'} backdrop-blur-sm`}>
        <div className="mb-2">
          <h4 className="font-bold text-white flex items-center gap-2">
            {player.name} 
            {player.isDealer && <span className="text-yellow-400">👑</span>}
            {isTurn && <span className="text-green-400">▶</span>}
          </h4>
          <p className="text-sm text-yellow-300">Points: {player.points}</p>
          {(player.rings.gold > 0 || player.rings.platinum > 0) && (
            <p className="text-xs text-yellow-200">
              🥇{player.rings.gold} 🏆{player.rings.platinum}
            </p>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {showAllCards || player.id === 1
            ? player.cards.map((card, i) => (
                <Card 
                  key={i} 
                  card={card} 
                  onClick={() => isTurn && playCard(player.id - 1, i)} 
                  disabled={!isTurn} 
                />
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
          <div className="flex items-center justify-between flex-wrap gap-4">
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

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowAllCards(!showAllCards)}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                title={showAllCards ? "Hide all cards" : "Show all cards (Debug)"}
              >
                {showAllCards ? '👁️' : '👁️‍🗨️'}
              </button>

              {!roomCode ? (
                <button
                  onClick={() => setRoomCode(generateRoomCode())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
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
                  🎴 Draw Cards for Dealer
                </button>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-bold mb-2">Game Rules</h3>
                <ul className="text-green-100 text-sm space-y-1">
                  <li>• Deck: No 2s, J, Q, K, Jokers</li>
                  <li>• Dealing: 3 then 2 cards per player</li>
                  <li>• Follow suit if possible</li>
                  <li>• 12+ points = knocked out</li>
                  <li>• Win with 0 points for rings</li>
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
            <div className="flex gap-4 justify-center flex-wrap">
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
            
            {!manualDealing && (
              <div className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={() => setDealerChoice('straight')}
                    className={`px-6 py-3 rounded-lg transition-colors ${dealerChoice === 'straight' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                  >
                    Serve Straight
                  </button>
                  <button
                    onClick={() => setDealerChoice('flush')}
                    className={`px-6 py-3 rounded-lg transition-colors ${dealerChoice === 'flush' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                  >
                    Flush Cards
                  </button>
                  {dealerChoice === 'flush' && (
                    <div className="flex items-center gap-2">
                      <label className="text-white">Cards to flush:</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={flushCount}
                        onChange={(e) => setFlushCount(parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-2 bg-white/20 text-white text-center border border-white/20 rounded"
                      />
                    </div>
                  )}
                </div>
                
                {dealerChoice && (
                  <button
                    onClick={dealCards}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    🎯 Start Manual Dealing
                  </button>
                )}
              </div>
            )}

            {/* Manual Dealing Controls */}
            {manualDealing && (
              <div className="space-y-4">
                <div className="bg-yellow-400/20 border border-yellow-400/50 rounded-lg p-4">
                  <h3 className="text-yellow-100 font-bold mb-2">Manual Dealing in Progress</h3>
                  <p className="text-yellow-200 text-sm mb-3">
                    Round {dealRound + 1}/{cardsPerRound.length} - 
                    Next card goes to: <strong>{players[currentDealPlayer].name}</strong>
                    ({currentRoundCardCount + 1}/{cardsPerRound[dealRound]} cards this round)
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => dealSingleCard()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      disabled={deck.length === 0}
                    >
                      🃏 Deal Card ({deck.length} left)
                    </button>
                    
                    {/* Quick deal buttons for each player */}
                    <div className="flex gap-2">
                      {players.map((player, i) => (
                        !player.optedOut && (
                          <button
                            key={i}
                            onClick={() => dealSingleCard(i)}
                            className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                              i === currentDealPlayer 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            {player.name}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {players.map((player, i) => (
            !player.optedOut && (
              <PlayerHand 
                key={player.id} 
                player={player} 
                playCard={playCard} 
                currentPlayer={currentPlayer} 
              />
            )
          ))}
        </div>

        {/* Center Area - Flushed Cards and Current Trick */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Flushed Cards */}
            {flushedCards.length > 0 && (
              <div className="text-center">
                <h3 className="text-white font-bold mb-3">Flushed Cards</h3>
                <div className="flex gap-2 justify-center flex-wrap">
                  {flushedCards.map((card, i) => (
                    <Card key={i} card={card} disabled={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Current Trick */}
            {roundCards.length > 0 && (
              <div className="text-center">
                <h3 className="text-white font-bold mb-3">
                  Current Trick 
                  {callingCard && <span className="text-yellow-300"> (Following {callingCard.suit})</span>}
                </h3>
                <div className="flex gap-2 justify-center flex-wrap">
                  {roundCards.map((rc, i) => (
                    <div key={i} className="text-center">
                      <Card card={rc.card} disabled={true} />
                      <p className="text-xs text-green-200 mt-1">{players[rc.playerId].name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Game State Info */}
          {gameState === 'playing' && (
            <div className="mt-6 text-center">
              <div className="bg-blue-600/20 rounded-lg p-4">
                <h4 className="text-white font-bold mb-2">Game Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {players.filter(p => !p.optedOut).map((player, i) => (
                    <div key={i} className="text-center">
                      <div className="text-white font-semibold">{player.name}</div>
                      <div className="text-yellow-300">{player.points} pts</div>
                      <div className="text-blue-200">{player.cards.length} cards</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Game End */}
        {gameState === 'game-end' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">🎉 Game Over! 🎉</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {players.map((player, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-4">
                  <h4 className="text-white font-bold">{player.name}</h4>
                  <p className="text-yellow-300">Final Points: {player.points}</p>
                  <p className="text-blue-200">Status: {player.optedOut ? '❌ Knocked Out' : '✅ Active'}</p>
                  {(player.rings.gold > 0 || player.rings.platinum > 0) && (
                    <p className="text-yellow-200">🥇{player.rings.gold} 🏆{player.rings.platinum}</p>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🔄 New Game
            </button>
          </div>
        )}

        {/* Debug Info */}
        {showAllCards && (
          <div className="bg-red-900/20 backdrop-blur-sm rounded-2xl p-4 border border-red-600/30">
            <h3 className="text-red-200 font-bold mb-2">🔧 Debug Info</h3>
            <div className="text-red-100 text-xs space-y-1">
              <p>Game State: {gameState}</p>
              <p>Current Player: {currentPlayer} ({players[currentPlayer]?.name})</p>
              <p>Dealer: {players.findIndex(p => p.isDealer)} ({players.find(p => p.isDealer)?.name})</p>
              <p>Manual Dealing: {manualDealing ? 'Yes' : 'No'}</p>
              <p>Deal Round: {dealRound + 1}/{cardsPerRound.length}</p>
              <p>Cards Left in Deck: {deck.length}</p>
              <p>Direction: {direction}</p>
              {callingCard && <p>Calling Card: {callingCard.rank}{callingCard.suit}</p>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CardGame;
