import React, { useState, useEffect, useRef } from 'react';
import { Users, Shuffle, Play, Crown, Target, Edit2, Save, X, Eye, Hand, RefreshCw } from 'lucide-react';

// Card component to render a single playing card
const Card = ({ card, size = 'default', onClick, isInteractive, isHighlighted }) => {
  if (!card) {
    return (
      <div className={`
        bg-slate-700/50 rounded-xl shadow-lg border border-slate-600
        flex items-center justify-center text-slate-400
        ${size === 'default' ? 'min-w-[60px] h-[90px]' : 'min-w-[80px] h-[120px]'}
      `}>
        <Hand size={24} />
      </div>
    );
  }

  const isRed = card.suit === '♥' || card.suit === '♦';
  const rankColor = isRed ? 'text-red-600' : 'text-black';
  const suitColor = isRed ? 'text-red-600' : 'text-black';

  const cardSizeClasses = {
    default: 'min-w-[60px] h-[90px] text-lg',
    large: 'min-w-[80px] h-[120px] text-2xl'
  };

  const rankSizeClasses = {
    default: 'text-sm',
    large: 'text-xl'
  };

  const suitSizeClasses = {
    default: 'text-xl',
    large: 'text-3xl'
  };

  const cardClasses = `
    flex flex-col items-center justify-between bg-white rounded-xl p-2 shadow-lg border-2 border-slate-300
    ${cardSizeClasses[size]}
    ${isInteractive ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
    ${isHighlighted ? 'ring-4 ring-blue-500' : ''}
  `;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className={`font-bold ${rankColor} ${rankSizeClasses[size]}`}>{card.rank}</div>
      <div className={`font-bold ${suitColor} ${suitSizeClasses[size]}`}>{card.suit}</div>
    </div>
  );
};


const CardGame = () => {
  const [numberOfPlayers, setNumberOfPlayers] = useState(4);
  const [direction, setDirection] = useState('clockwise');
  const [gameState, setGameState] = useState('setup');
  const [players, setPlayers] = useState([]);
  const [deck, setDeck] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [callingCard, setCallingCard] = useState(null);
  const [roundCards, setRoundCards] = useState([]);
  const [message, setMessage] = useState('Set up the game to begin!');
  const [dealerSelectionPhase, setDealerSelectionPhase] = useState(false);
  const [dealerSelectionCards, setDealerSelectionCards] = useState([]);
  const [editingPoints, setEditingPoints] = useState({});
  const [currentPlayerView, setCurrentPlayerView] = useState(0);

  // Helper function to create a new, shuffled deck
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
    // Special card values
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

  // Function to initialize players and start the dealer selection
  const initializeGame = () => {
    const newPlayers = Array.from({ length: numberOfPlayers }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      cards: [],
      points: 0,
      isDealer: false,
      optedOut: false,
    }));
    setPlayers(newPlayers);
    setCurrentPlayerView(0);

    const newDeck = createDeck();
    setDeck(newDeck);

    setDealerSelectionPhase(true);
    const selectionCards = [];
    for (let i = 0; i < newPlayers.length; i++) {
      selectionCards.push({
        playerId: i,
        card: newDeck[i]
      });
    }
    setDealerSelectionCards(selectionCards);
    setMessage('Each player has drawn a card. The highest card will determine the first dealer.');
  };

  const determineDealer = () => {
    let highestCardSelection = dealerSelectionCards[0];
    for (let i = 1; i < dealerSelectionCards.length; i++) {
      if (getCardNumber(dealerSelectionCards[i].card.rank) > getCardNumber(highestCardSelection.card.rank)) {
        highestCardSelection = dealerSelectionCards[i];
      }
    }

    const newPlayers = [...players];
    const dealerIndex = highestCardSelection.playerId;
    newPlayers.forEach(p => p.isDealer = false);
    newPlayers[dealerIndex].isDealer = true;
    setPlayers(newPlayers);
    
    setDealerSelectionPhase(false);
    setGameState('dealing');
    setMessage(`${newPlayers[dealerIndex].name} is the dealer! The game will now deal the cards.`);
    
    setTimeout(() => dealCards(), 2000);
  };

  // Automated dealing function
  const dealCards = () => {
    const newPlayers = [...players];
    const newDeck = createDeck();
    
    const dealerIndex = newPlayers.findIndex(p => p.isDealer);
    let currentPlayerIndex = (dealerIndex + 1) % newPlayers.length;

    // Deal 5 cards to each player, starting after the dealer and ending with the dealer
    for (let cardCount = 0; cardCount < 5; cardCount++) {
      for (let i = 0; i < newPlayers.length; i++) {
        if (newDeck.length > 0) {
          const card = newDeck.shift();
          newPlayers[currentPlayerIndex].cards.push(card);
        }
        currentPlayerIndex = (currentPlayerIndex + 1) % newPlayers.length;
      }
    }
    
    setPlayers(newPlayers);
    setDeck(newDeck);
    setGameState('playing');
    
    // The player to the left of the dealer starts the round
    const firstPlayerIndex = (dealerIndex + 1) % newPlayers.length;
    setCurrentPlayer(firstPlayerIndex);
    setMessage(`Cards dealt! ${newPlayers[firstPlayerIndex].name} leads the round!`);
  };

  const playCard = (playerId, cardIndex) => {
    if (playerId !== currentPlayer || players[playerId].optedOut) return;
    
    const player = players[playerId];
    const card = player.cards[cardIndex];
    
    // Check for foul: must follow suit if possible
    if (callingCard && card.suit !== callingCard.suit) {
      const hasCallingCardSuit = player.cards.some(c => c.suit === callingCard.suit);
      if (hasCallingCardSuit) {
        applyFoul(playerId, "Must follow the calling card suit!");
        return;
      }
    }
    
    const newPlayers = [...players];
    const playedCard = newPlayers[playerId].cards.splice(cardIndex, 1)[0];
    
    const newRoundCards = [...roundCards, { card: playedCard, playerId }];
    setRoundCards(newRoundCards);
    
    if (!callingCard) {
      setCallingCard(playedCard);
    }
    
    setPlayers(newPlayers);
    
    let nextPlayer = direction === 'clockwise' ? (currentPlayer + 1) % players.length : (currentPlayer - 1 + players.length) % players.length;
    while (players[nextPlayer].optedOut && newRoundCards.length < players.filter(p => !p.optedOut).length) {
      nextPlayer = direction === 'clockwise' ? (nextPlayer + 1) % players.length : (nextPlayer - 1 + players.length) % players.length;
    }
    
    setCurrentPlayer(nextPlayer);
    
    const activePlayersCount = players.filter(p => !p.optedOut).length;
    if (newRoundCards.length === activePlayersCount) {
      setTimeout(() => endRound(newRoundCards), 1500);
    }
  };
  
  const endRound = (roundCards) => {
    const callingCardSuit = callingCard.suit;
    const callingCardPlays = roundCards.filter(rc => rc.card.suit === callingCardSuit);
    
    let winner;
    if (callingCardPlays.length > 0) {
      winner = callingCardPlays.reduce((prev, current) => 
        getCardNumber(current.card.rank) > getCardNumber(prev.card.rank) ? current : prev
      );
    } else {
      winner = roundCards.find(rc => rc.playerId === roundCards[0].playerId);
    }

    const winningPlayerIndex = winner.playerId;
    const playerWhoTakesDamage = players.filter(p => !p.optedOut).find(p => p.id !== winner.playerId);
    
    const newPlayers = [...players];
    const damage = winner.card.value;
    newPlayers[playerWhoTakesDamage.id - 1].points += damage;
    
    if (newPlayers[playerWhoTakesDamage.id - 1].points >= 12) {
      newPlayers[playerWhoTakesDamage.id - 1].optedOut = true;
      setMessage(`Round over! ${newPlayers[playerWhoTakesDamage.id - 1].name} is knocked out with ${newPlayers[playerWhoTakesDamage.id - 1].points} points! ${newPlayers[winningPlayerIndex].name} deals next round.`);
    } else {
      setMessage(`Round over! ${newPlayers[playerWhoTakesDamage.id - 1].name} takes ${damage} damage (${newPlayers[playerWhoTakesDamage.id - 1].points} total points). ${newPlayers[winningPlayerIndex].name} deals next round.`);
    }
    
    newPlayers.forEach(p => p.isDealer = false);
    newPlayers[winningPlayerIndex].isDealer = true;
    
    setPlayers(newPlayers);
    setCallingCard(null);
    setRoundCards([]);
    
    const allCardsPlayed = newPlayers.every(p => p.cards.length === 0 || p.optedOut);
    if (allCardsPlayed) {
      const activePlayers = newPlayers.filter(p => !p.optedOut);
      if (activePlayers.length <= 1) {
        setGameState('game-end');
        if (activePlayers.length === 1) {
          setMessage(`🏆 ${activePlayers[0].name} wins the game! 🏆`);
        } else {
          setMessage('Game over - all players are out!');
        }
      } else {
        setTimeout(() => startNewRound(), 3000);
      }
    } else {
      // Continue to the next trick within the same round
      setCurrentPlayer(winningPlayerIndex);
      setMessage(`${players[winningPlayerIndex].name} wins the trick and leads the next one!`);
    }
  };

  const startNewRound = () => {
    const newPlayers = [...players];
    const newDeck = createDeck();
    
    newPlayers.forEach(player => {
      if (!player.optedOut) {
        player.cards = [];
      }
    });
    
    setPlayers(newPlayers);
    setDeck(newDeck);
    setGameState('dealing');
    setCallingCard(null);
    setRoundCards([]);
    
    // Auto-deal for the new round
    setTimeout(() => dealCards(), 2000);
  };

  const applyFoul = (playerId, reason) => {
    const newPlayers = [...players];
    newPlayers[playerId].points += 2;
    setPlayers(newPlayers);
    setMessage(`Foul! ${newPlayers[playerId].name}: ${reason} (+2 points)`);
  };

  const handlePointOverride = (playerId, newPoints) => {
    const newPlayers = [...players];
    newPlayers[playerId].points = parseInt(newPoints) || 0;
    setPlayers(newPlayers);
    setEditingPoints({ ...editingPoints, [playerId]: false });
  };

  const optOut = (playerId) => {
    const newPlayers = [...players];
    newPlayers[playerId].optedOut = true;
    setPlayers(newPlayers);
    setMessage(`${newPlayers[playerId].name} has opted out of the round.`);
    
    const activePlayersCount = newPlayers.filter(p => !p.optedOut).length;
    if (activePlayersCount <= 1) {
      setTimeout(() => endRound(roundCards), 1500);
    }
  };

  const resetGame = () => {
    setGameState('setup');
    setPlayers([]);
    setRoundCards([]);
    setCallingCard(null);
    setDealerSelectionPhase(false);
    setMessage('Game reset. Set up a new game to begin.');
  };
  

  return (
    <div className="min-h-screen bg-green-800 p-4 font-sans text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-green-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-4 border-green-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h1 className="text-5xl font-bold text-white flex items-center gap-4">
              <span role="img" aria-label="spade" className="text-white text-6xl">♠</span>
              Card Game
            </h1>
            <button
                onClick={resetGame}
                className="px-6 py-2 bg-slate-600 text-white rounded-full font-semibold hover:bg-slate-700 flex items-center gap-2 transition-colors mt-4 sm:mt-0"
              >
                <RefreshCw size={20} />
                Reset Game
              </button>
          </div>
          <p className="text-slate-300 italic text-xl mt-2">{message}</p>
        </div>

        {gameState === 'setup' && (
          <div className="bg-green-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-4 border-green-700">
            <h2 className="text-3xl font-bold text-white mb-4">Game Setup</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-slate-300 block mb-2 text-lg">Number of Players:</label>
                <select 
                  value={numberOfPlayers} 
                  onChange={(e) => setNumberOfPlayers(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={5}>5 Players</option>
                  <option value={6}>6 Players</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-2 text-lg">Direction:</label>
                <select 
                  value={direction} 
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="clockwise">Clockwise</option>
                  <option value="anticlockwise">Anticlockwise</option>
                </select>
              </div>
            </div>
            <button 
              onClick={initializeGame}
              className="w-full px-8 py-4 bg-yellow-400 text-green-900 rounded-full font-bold text-xl hover:bg-yellow-500 flex items-center justify-center gap-3 transition-colors shadow-lg"
            >
              <Play className="w-6 h-6" />
              Start Game
            </button>
          </div>
        )}

        {dealerSelectionPhase && (
          <div className="bg-green-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-4 border-green-700 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Dealer Selection</h2>
            <p className="text-slate-300 text-xl mb-6">Each player has drawn a card. The player with the highest card will deal first.</p>
            <div className="flex flex-wrap gap-6 justify-center">
              {dealerSelectionCards.map((selection, index) => (
                <div key={index} className="text-center">
                  <div className="text-white font-semibold mb-2 text-lg">{players[selection.playerId].name}</div>
                  <Card card={selection.card} size="large" />
                </div>
              ))}
            </div>
            <button 
              onClick={determineDealer}
              className="mt-8 px-8 py-4 bg-yellow-400 text-green-900 rounded-full font-bold text-xl hover:bg-yellow-500 transition-colors shadow-lg"
            >
              Determine Dealer
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-green-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-4 border-green-700">
                <h3 className="text-2xl font-bold text-white mb-4">Players</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {players.map((player, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-xl shadow-lg border-2 transition-all duration-300
                      ${player.isDealer ? 'bg-yellow-400/20 border-yellow-400' : 'bg-green-700/50 border-green-600'}
                      ${currentPlayer === index && !player.optedOut ? 'ring-4 ring-blue-400' : ''}
                      ${player.optedOut ? 'bg-red-900/50 opacity-60 border-red-800' : ''}`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xl">
                            {player.name}
                          </span>
                          {player.isDealer && <Crown className="w-6 h-6 text-yellow-400" />}
                          {currentPlayer === index && <Target className="w-6 h-6 text-blue-400 animate-pulse" />}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1 text-slate-200 text-md">
                            <Hand size={18} /> {player.cards.length} cards
                          </div>
                          {editingPoints[index] ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={player.points}
                                onChange={(e) => {
                                  const newPlayers = [...players];
                                  newPlayers[index].points = parseInt(e.target.value) || 0;
                                  setPlayers(newPlayers);
                                }}
                                className="w-16 px-2 py-1 text-center text-black rounded-md"
                              />
                              <button onClick={() => handlePointOverride(index, player.points)}><Save className="w-5 h-5 text-green-400" /></button>
                              <button onClick={() => setEditingPoints({ ...editingPoints, [index]: false })}><X className="w-5 h-5 text-red-400" /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-lg">{player.points} pts</span>
                              <button onClick={() => setEditingPoints({ ...editingPoints, [index]: true })}><Edit2 className="w-4 h-4 text-slate-400 hover:text-white" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                      {player.optedOut && (
                        <div className="text-red-400 font-bold mt-2 text-sm">KNOCKED OUT</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-4 border-green-700">
                <h3 className="text-2xl font-bold text-white mb-4">Cards in Play</h3>
                <div className="flex flex-wrap gap-6 justify-center">
                  {roundCards.length > 0 ? roundCards.map(rc => (
                    <div key={rc.playerId} className="text-center">
                      <div className="text-slate-300 text-sm mb-1">{players[rc.playerId].name}</div>
                      <Card card={rc.card} />
                    </div>
                  )) : (
                    <p className="text-slate-400 italic">No cards played yet this trick.</p>
                  )}
                </div>
              </div>

              <div className="bg-green-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-4 border-green-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Hand size={28} /> My Hand: <span className="text-yellow-400">{players[currentPlayerView]?.name}</span>
                  </h3>
                  {players[currentPlayerView]?.id - 1 === currentPlayer && (
                    <button onClick={() => optOut(currentPlayer)} className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors">Opt Out of Round</button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4 justify-center">
                  {players[currentPlayerView]?.cards.map((card, cardIndex) => (
                    <Card
                      key={card.id}
                      card={card}
                      isInteractive={players[currentPlayerView]?.id - 1 === currentPlayer}
                      onClick={() => playCard(players[currentPlayerView]?.id - 1, cardIndex)}
                    />
                  ))}
                </div>
                
                {numberOfPlayers > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                    <label className="text-slate-300 font-semibold text-lg flex items-center gap-2">
                      <Eye size={20} /> View Hand:
                    </label>
                    <select
                      value={currentPlayerView}
                      onChange={(e) => setCurrentPlayerView(parseInt(e.target.value))}
                      className="px-4 py-2 rounded-lg bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      {players.map((player, index) => (
                        <option key={index} value={index}>{player.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-green-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-4 border-green-700">
                <h3 className="text-2xl font-bold text-white mb-4">Game History</h3>
                <div className="bg-green-700/50 p-4 rounded-xl h-96 overflow-y-auto border border-green-600">
                  <p className="text-slate-400 italic">History coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'game-end' && (
          <div className="bg-green-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-4 border-green-700 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Game Over!</h2>
            <p className="text-slate-300 text-2xl mb-6">{message}</p>
            <button 
              onClick={resetGame}
              className="px-8 py-4 bg-yellow-400 text-green-900 rounded-full font-bold text-xl hover:bg-yellow-500 transition-colors shadow-lg"
            >
              Start New Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardGame;
