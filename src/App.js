import React, { useState, useEffect } from 'react';
import { Users, Shuffle, Play, Crown, Target, Edit2, Save, X, Eye, Hand } from 'lucide-react';

const CardGame = () => {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Player records (stored in memory - in real app would be backend)
  const [playerRecords, setPlayerRecords] = useState({});

  // Game configuration
  const [numberOfPlayers, setNumberOfPlayers] = useState(4);
  const [vsSystem, setVsSystem] = useState(false);

  // Game state
  const [gameState, setGameState] = useState('setup');
  const [players, setPlayers] = useState([]);
  const [deck, setDeck] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dealerChoice, setDealerChoice] = useState('');
  const [flushCount, setFlushCount] = useState(3);
  const [direction, setDirection] = useState('clockwise');
  const [callingCard, setCallingCard] = useState(null);
  const [roundCards, setRoundCards] = useState([]);
  const [message, setMessage] = useState('Welcome! Please log in to begin.');
  const [flushedCards, setFlushedCards] = useState([]);
  
  // Manual flush area
  const [manualFlushArea, setManualFlushArea] = useState([]);

  // Enhanced dealing state
  const [manualDealing, setManualDealing] = useState(false);
  const [dealingPhase, setDealingPhase] = useState('first'); // 'first' (3 cards), 'second' (2 cards)
  const [currentDealPlayer, setCurrentDealPlayer] = useState(0);
  const [dealingToPlayer, setDealingToPlayer] = useState(null);
  const [cardsDealtThisRound, setCardsDealtThisRound] = useState({});

  // Point override
  const [editingPoints, setEditingPoints] = useState({});

  // Game history
  const [gameHistory, setGameHistory] = useState([]);
  const [currentPlayerView, setCurrentPlayerView] = useState(0);
  const [dealerSelectionPhase, setDealerSelectionPhase] = useState(false);
  const [dealerSelectionCards, setDealerSelectionCards] = useState([]);

  // Helper function to render card suit symbols with color
  const renderCardSuit = (suit) => {
    switch (suit) {
      case '♠': return <span className="text-black font-bold">♠</span>;
      case '♥': return <span className="text-red-600 font-bold">♥</span>;
      case '♦': return <span className="text-red-600 font-bold">♦</span>;
      case '♣': return <span className="text-black font-bold">♣</span>;
      default: return null;
    }
  };

  const renderCard = (card, size = 'default') => {
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
  
    return (
      <div className={`flex flex-col items-center justify-between bg-white rounded-xl p-2 shadow-md hover:scale-105 transition-transform cursor-pointer ${cardSizeClasses[size]}`}>
        <div className={`font-bold ${rankColor} ${rankSizeClasses[size]}`}>{card.rank}</div>
        <div className={`font-bold ${suitColor} ${suitSizeClasses[size]}`}>{card.suit}</div>
      </div>
    );
  };


  // Initialize players based on numberOfPlayers
  useEffect(() => {
    const newPlayers = [];
    for (let i = 0; i < numberOfPlayers; i++) {
      if (i === 0 && isLoggedIn) {
        newPlayers.push({
          id: i + 1,
          name: currentUser,
          cards: [],
          points: 0,
          isDealer: false,
          optedOut: false,
          isHuman: true
        });
      } else if (vsSystem && i > 0) {
        newPlayers.push({
          id: i + 1,
          name: `AI Player ${i}`,
          cards: [],
          points: 0,
          isDealer: false,
          optedOut: false,
          isHuman: false
        });
      } else {
        newPlayers.push({
          id: i + 1,
          name: `Player ${i + 1}`,
          cards: [],
          points: 0,
          isDealer: false,
          optedOut: false,
          isHuman: true
        });
      }
    }
    setPlayers(newPlayers);
    setCurrentPlayerView(0);
  }, [numberOfPlayers, vsSystem, currentUser, isLoggedIn]);

  // Authentication functions
  const handleLogin = () => {
    if (!loginForm.username.trim()) return;
    
    // Simple authentication - in real app would validate against backend
    if (isRegistering) {
      setPlayerRecords(prev => ({
        ...prev,
        [loginForm.username]: {
          password: loginForm.password,
          rings: 0,
          gamesPlayed: 0,
          gamesWon: 0
        }
      }));
    }
    
    setCurrentUser(loginForm.username);
    setIsLoggedIn(true);
    setGameState('setup');
    setMessage('Welcome! Set up the game to begin.');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setLoginForm({ username: '', password: '' });
    setGameState('setup');
    setMessage('Please log in to play.');
  };

  // Award ring to winner
  const awardRing = (winnerId) => {
    const winner = players[winnerId];
    if (winner.name === currentUser) {
      setPlayerRecords(prev => ({
        ...prev,
        [currentUser]: {
          ...prev[currentUser],
          rings: (prev[currentUser]?.rings || 0) + 1,
          gamesWon: (prev[currentUser]?.gamesWon || 0) + 1
        }
      }));
    }
  };

  // Create deck without 2s, Jacks, Queens, Kings, Jokers
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
    newPlayers[dealerCard.playerId].isDealer = true;
    setPlayers(newPlayers);
    setCurrentPlayer(dealerCard.playerId);
    setDealerSelectionPhase(false);
    setGameState('dealing');
    setMessage(`${newPlayers[dealerCard.playerId].name} deals first! (Drew ${dealerCard.card.rank}${dealerCard.card.suit})`);
  };

  const dealCards = () => {
    if (!dealerChoice) return;
    
    let cardIndex = players.length;
    const newDeck = [...deck];
    const newFlushedCards = [];
    
    if (dealerChoice === 'flush') {
      for (let i = 0; i < flushCount; i++) {
        newFlushedCards.push(newDeck[cardIndex]);
        cardIndex++;
      }
      setFlushedCards(newFlushedCards);
    }
    
    setManualDealing(true);
    setDealingPhase('first');
    setCurrentDealPlayer(0);
    setCardsDealtThisRound({});
    setDeck(newDeck.slice(cardIndex));
    setManualFlushArea([]);
    
    const dealTracking = {};
    players.forEach((_, index) => {
      dealTracking[index] = 0;
    });
    setCardsDealtThisRound(dealTracking);
    
    const dealerIndex = players.findIndex(p => p.isDealer);
    const nextPlayerIndex = direction === 'clockwise' ? 
      (dealerIndex + 1) % players.length : 
      (dealerIndex - 1 + players.length) % players.length;
    
    setCurrentDealPlayer(nextPlayerIndex);
    setMessage(`Manual dealing started. Dealer starts with ${players[nextPlayerIndex].name}. Phase 1: Deal 3 cards to each player.`);
  };

  const manualFlushCard = () => {
    if (deck.length === 0) return;
    
    const newManualFlush = [...manualFlushArea, deck[0]];
    setManualFlushArea(newManualFlush);
    setDeck(deck.slice(1));
    setMessage(`Card flushed manually. ${newManualFlush.length} cards in flush area.`);
  };

  const dealSingleCard = (targetPlayerId = null) => {
    if (!manualDealing || deck.length === 0) return;
    
    const dealerIndex = players.findIndex(p => p.isDealer);
    const expectedPlayerIndex = currentDealPlayer;
    const expectedCardsForThisPlayer = dealingPhase === 'first' ? 3 : 2;
    
    let playerToReceive = targetPlayerId !== null ? targetPlayerId : expectedPlayerIndex;
    
    if (targetPlayerId !== null && targetPlayerId !== expectedPlayerIndex) {
      applyFoul(dealerIndex, "Dealing cards to wrong player!");
    }
    
    const newPlayers = [...players];
    newPlayers[playerToReceive].cards.push(deck[0]);
    setPlayers(newPlayers);
    setDeck(deck.slice(1));
    setDealingToPlayer(null);
    
    const newCardsDealt = { ...cardsDealtThisRound };
    newCardsDealt[playerToReceive] = (newCardsDealt[playerToReceive] || 0) + 1;
    setCardsDealtThisRound(newCardsDealt);
    
    if (newCardsDealt[expectedPlayerIndex] >= expectedCardsForThisPlayer) {
      let nextPlayerIndex;
      if (dealingPhase === 'first') {
        const activePlayers = players.filter((_, index) => index !== dealerIndex && !players[index].optedOut);
        const currentActiveIndex = activePlayers.findIndex(p => players.indexOf(p) === currentDealPlayer);
        if (currentActiveIndex < activePlayers.length - 1) {
          const nextActivePlayer = activePlayers[currentActiveIndex + 1];
          nextPlayerIndex = players.indexOf(nextActivePlayer);
        } else {
          setDealingPhase('second');
          nextPlayerIndex = direction === 'clockwise' ? 
            (dealerIndex + 1) % players.length : 
            (dealerIndex - 1 + players.length) % players.length;
          
          const resetTracking = {};
          players.forEach((_, index) => {
            resetTracking[index] = 0;
          });
          setCardsDealtThisRound(resetTracking);
          setMessage(`Phase 1 complete! Phase 2: Deal 2 cards to each player (including dealer).`);
        }
      } else {
        nextPlayerIndex = direction === 'clockwise' ? 
          (currentDealPlayer + 1) % players.length : 
          (currentDealPlayer - 1 + players.length) % players.length;
      }
      
      setCurrentDealPlayer(nextPlayerIndex);
    }
    
    const allPlayersHave5Cards = players.every(player => player.cards.length === 5);
    if (allPlayersHave5Cards) {
      setManualDealing(false);
      setGameState('playing');
      
      const dealerIndex = players.findIndex(p => p.isDealer);
      const firstPlayerIndex = direction === 'clockwise' ? 
        (dealerIndex + 1) % players.length : 
        (dealerIndex - 1 + players.length) % players.length;
      setCurrentPlayer(firstPlayerIndex);
      setMessage(`Cards dealt! Each player has 5 cards. ${players[firstPlayerIndex].name} leads the round!`);
    }
  };

  const playCard = (playerId, cardIndex) => {
    if (playerId !== currentPlayer || players[playerId].optedOut) return;
    
    const player = players[playerId];
    const card = player.cards[cardIndex];
    
    if (callingCard && card.suit !== callingCard.suit) {
      const hasCallingCardSuit = player.cards.some(c => c.suit === callingCard.suit);
      if (hasCallingCardSuit) {
        applyFoul(playerId, "Must follow calling card suit when you have it!");
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
    
    let nextPlayer = direction === 'clockwise' ? 
      (currentPlayer + 1) % players.length : 
      (currentPlayer - 1 + players.length) % players.length;
    
    while (players[nextPlayer].optedOut && newRoundCards.length < players.filter(p => !p.optedOut).length) {
      nextPlayer = direction === 'clockwise' ? 
        (nextPlayer + 1) % players.length : 
        (nextPlayer - 1 + players.length) % players.length;
    }
    
    setCurrentPlayer(nextPlayer);
    
    if (newRoundCards.length === players.filter(p => !p.optedOut).length) {
      endRound(newRoundCards);
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
      winner = roundCards[0];
    }
    
    setCurrentPlayer(winner.playerId);
    
    const activePlayers = players.filter(p => !p.optedOut);
    const allCardsPlayed = activePlayers.every(p => p.cards.length === 0);
    
    if (allCardsPlayed) {
      handleEndOfRound(winner, roundCards);
    } else {
      setCallingCard(null);
      setRoundCards([]);
      setMessage(`${players[winner.playerId].name} wins the trick and leads next!`);
    }
  };

  const handleEndOfRound = (winner, roundCards) => {
    const roundHistory = {
      roundNumber: gameHistory.length + 1,
      cards: roundCards.map(rc => ({
        playerName: players[rc.playerId].name,
        card: rc.card
      })),
      winner: players[winner.playerId].name,
      winningCard: winner.card
    };
    
    setGameHistory(prev => [...prev, roundHistory]);
    
    const attackCard = winner.card;
    const attackValue = attackCard.value;
    
    let nextPlayerId = direction === 'clockwise' ? 
      (winner.playerId + 1) % players.length : 
      (winner.playerId - 1 + players.length) % players.length;
    
    while (players[nextPlayerId].optedOut) {
      nextPlayerId = direction === 'clockwise' ? 
        (nextPlayerId + 1) % players.length : 
        (nextPlayerId - 1 + players.length) % players.length;
    }
    
    const newPlayers = [...players];
    newPlayers[nextPlayerId].points += attackValue;
    
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
    
    const activePlayers = newPlayers.filter(p => !p.optedOut);
    if (activePlayers.length <= 1) {
      setGameState('game-end');
      if (activePlayers.length === 1) {
        awardRing(players.indexOf(activePlayers[0]));
        setMessage(`🏆 ${activePlayers[0].name} wins the game and earns a Golden Ring! 🏆`);
      } else {
        setMessage('Game over - no players remaining!');
      }
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
    setManualFlushArea([]);
    setManualDealing(false);
    setCurrentDealPlayer(0);
    setCardsDealtThisRound({});
    setDealingToPlayer(null);
    setDealingPhase('first');
    
    const newPlayers = [...players];
    newPlayers.forEach(player => {
      if (!player.optedOut) {
        player.cards = [];
      }
    });
    setPlayers(newPlayers);
    
    const dealerIndex = players.findIndex(p => p.isDealer);
    setCurrentPlayer(dealerIndex);
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
    setMessage(`${newPlayers[playerId].name} has opted out of the game.`);
  };

  const resetGame = () => {
    setGameState('setup');
    setPlayers(prev => prev.map(p => ({
      ...p,
      cards: [],
      points: 0,
      isDealer: false,
      optedOut: false
    })));
    setGameHistory([]);
    setEditingPoints({});
    setMessage('Game reset. Set up a new game to begin.');
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 bg-opacity-70 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-lg border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Card Game Login</h1>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isRegistering ? 'Switch to Login' : 'Register New Player'}
              </button>
              <button
                onClick={handleLogin}
                disabled={!loginForm.username.trim()}
                className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegistering ? 'Create Account' : 'Login'}
              </button>
            </div>
          </div>
          
          {Object.keys(playerRecords).length > 0 && (
            <div className="mt-8 bg-slate-700/50 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3">Player Records:</h3>
              <div className="space-y-2">
                {Object.entries(playerRecords).map(([player, record]) => (
                  <div key={player} className="flex justify-between items-center text-slate-200 text-sm">
                    <span>{player}</span>
                    <span className="flex items-center gap-1">
                      <Crown size={16} className="text-yellow-400"/>
                      {record.rings}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 font-sans text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-slate-800 bg-opacity-70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h1 className="text-4xl font-bold text-white flex items-center gap-4">
              <span role="img" aria-label="spade" className="text-white text-5xl">♠</span>
              Card Game
            </h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 sm:mt-0">
              <div className="text-slate-200 text-lg flex items-center gap-2">
                <Crown size={20} className="text-yellow-400" />
                Welcome, <span className="font-semibold text-white">{currentUser}</span>!
                {playerRecords[currentUser] && (
                  <span className="ml-2 font-bold text-yellow-400">
                    {playerRecords[currentUser].rings} rings
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          <p className="text-slate-300 italic">{message}</p>
        </div>

        {gameState === 'setup' && (
          <div className="bg-slate-800 bg-opacity-70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Game Setup</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-slate-300 block mb-2">Number of Players:</label>
                <select 
                  value={numberOfPlayers} 
                  onChange={(e) => setNumberOfPlayers(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={5}>5 Players</option>
                  <option value={6}>6 Players</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-2">Direction:</label>
                <select 
                  value={direction} 
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="clockwise">Clockwise</option>
                  <option value="anticlockwise">Anticlockwise</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center text-slate-300 font-semibold">
                  <input
                    type="checkbox"
                    checked={vsSystem}
                    onChange={(e) => setVsSystem(e.target.checked)}
                    className="mr-2 h-4 w-4 text-emerald-500 bg-slate-700 border-slate-600 rounded-sm"
                  />
                  Play vs AI
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={initializeGame}
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                Draw Cards for Dealer
              </button>
              <button 
                onClick={resetGame}
                className="px-6 py-3 bg-slate-600 text-white rounded-full font-semibold hover:bg-slate-700 transition-colors"
              >
                Reset Game
              </button>
            </div>
          </div>
        )}

        {dealerSelectionPhase && dealerSelectionCards.length > 0 && (
          <div className="bg-slate-800 bg-opacity-70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Dealer Selection</h2>
            <p className="text-slate-300 mb-6">Each player has drawn a card. The player with the highest card will deal first.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6 justify-center">
              {dealerSelectionCards.map((selection, index) => (
                <div key={index} className="text-center">
                  <div className="text-white font-semibold mb-2 text-lg">{players[selection.playerId].name}</div>
                  {renderCard(selection.card, 'large')}
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => determineDealerFromCards(true)}
                className="px-6 py-3 bg-emerald-500 text-white rounded-full font-semibold hover:bg-emerald-600 transition-colors"
              >
                Highest Card Deals
              </button>
              <button 
                onClick={() => determineDealerFromCards(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
              >
                Lowest Card Deals
              </button>
            </div>
          </div>
        )}

        {gameState === 'dealing' && (
          <div className="bg-slate-800 bg-opacity-70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Dealer's Choice</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
              <button 
                onClick={() => setDealerChoice('straight')}
                className={`px-6 py-3 rounded-full font-semibold transition-colors ${dealerChoice === 'straight' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                Serve Straight
              </button>
              <button 
                onClick={() => setDealerChoice('flush')}
                className={`px-6 py-3 rounded-full font-semibold transition-colors ${dealerChoice === 'flush' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                Flush Cards
              </button>
              {dealerChoice === 'flush' && (
                <input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={flushCount}
                  onChange={(e) => setFlushCount(parseInt(e.target.value) || 3)}
                  className="w-20 px-4 py-2 rounded-lg bg-slate-700 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
            {dealerChoice && !manualDealing && (
              <button 
                onClick={dealCards}
                className="px-8 py-4 bg-emerald-500 text-white rounded-full font-bold text-lg hover:bg-emerald-600 flex items-center justify-center gap-3 transition-colors"
              >
                <Shuffle className="w-6 h-6" />
                Start Manual Dealing
              </button>
            )}

            {manualDealing && (
              <div className="mt-8">
                <p className="text-slate-300 mb-4">Dealing Phase {dealingPhase === 'first' ? '1 (3 cards)' : '2 (2 cards)'}. Next player to deal to: <span className="font-bold text-white">{players[currentDealPlayer]?.name}</span></p>
                <div className="flex flex-wrap gap-4 mb-4">
                  <button onClick={manualFlushCard} className="px-6 py-3 bg-yellow-600 text-white rounded-full font-semibold hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={!manualDealing}>Flush Card</button>
                  <button onClick={() => dealSingleCard()} className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={!manualDealing}>Deal to {players[currentDealPlayer]?.name}</button>
                </div>
                <div className="mt-6">
                  <p className="text-slate-300 mb-2">Click a player to deal directly to them:</p>
                  <div className="flex flex-wrap gap-2">
                    {players.map((player, index) => (
                      <button
                        key={index}
                        onClick={() => dealSingleCard(index)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${index === currentDealPlayer ? 'bg-blue-800 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        disabled={!manualDealing}
                      >
                        {player.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {manualFlushArea.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-white font-bold">Flushed Cards (Manual)</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {manualFlushArea.map(card => (
                        <div key={card.id} className="w-16 h-24 flex flex-col items-center justify-between bg-white rounded-xl p-2 shadow-md">
                          <span className={`text-sm font-bold ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>{card.rank}</span>
                          <span className={`text-xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>{card.suit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {flushedCards.length > 0 && (
              <div className="mt-8">
                <h3 className="text-white font-bold mb-3">Flushed Cards (Dealer's Choice)</h3>
                <div className="flex flex-wrap gap-2">
                  {flushedCards.map(card => (
                    <div key={card.id} className="w-16 h-24 flex flex-col items-center justify-between bg-white rounded-xl p-2 shadow-md">
                      <span className={`text-sm font-bold ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>{card.rank}</span>
                      <span className={`text-xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>{card.suit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {gameState !== 'setup' && gameState !== 'game-end' && gameState !== 'dealing' && (
          <div className="bg-slate-800 bg-opacity-70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Round in Progress</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h3 className="text-xl font-semibold text-white mb-3">Players</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {players.map((player, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-xl shadow-lg border-2 transition-all duration-300 ${player.isDealer ? 'bg-yellow-400/20 border-yellow-400' : 'bg-slate-700/50 border-slate-600'} ${currentPlayer === index && !player.optedOut ? 'border-blue-400 scale-105' : ''} ${player.optedOut ? 'bg-red-900/50 opacity-60 border-red-800' : ''}`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-white text-lg ${player.isHuman ? '' : 'italic text-slate-300'}`}>
                            {player.name}
                          </span>
                          {player.isDealer && <Crown className="w-5 h-5 text-yellow-400" />}
                          {currentPlayer === index && <Target className="w-5 h-5 text-blue-400 animate-pulse" />}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1 text-slate-200 text-sm">
                            <Hand size={16} /> {player.cards.length} cards
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
                              <span className="text-white font-bold">{player.points} pts</span>
                              <button onClick={() => setEditingPoints({ ...editingPoints, [index]: true })}><Edit2 className="w-4 h-4 text-slate-400 hover:text-white" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                      {player.optedOut && (
                        <div className="text-red-400 text-sm font-bold mt-2">KNOCKED OUT</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-white mb-3">Cards in Play</h3>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    {roundCards.length > 0 ? roundCards.map(rc => (
                      <div key={rc.playerId} className="text-center">
                        <div className="text-slate-300 text-sm mb-1">{players[rc.playerId].name}</div>
                        {renderCard(rc.card)}
                      </div>
                    )) : (
                      <p className="text-slate-400 italic">No cards played yet this round.</p>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                    <Hand size={24} /> My Hand: <span className="text-blue-400">{players[currentPlayerView].name}</span>
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {players[currentPlayerView]?.cards.map((card, cardIndex) => (
                      <button
                        key={card.id}
                        onClick={() => playCard(currentPlayerView, cardIndex)}
                        className={`transition-transform hover:scale-110 ${currentPlayer !== currentPlayerView || players[currentPlayerView].optedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={currentPlayer !== currentPlayerView || players[currentPlayerView].optedOut}
                      >
                        {renderCard(card)}
                      </button>
                    ))}
                  </div>
                  {currentPlayer === currentPlayerView && players[currentPlayerView].cards.length > 0 && (
                    <div className="mt-6">
                      <button onClick={() => optOut(currentPlayerView)} className="px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors">Opt Out of Round</button>
                    </div>
                  )}
                </div>
                
                {numberOfPlayers > 1 && (
                  <div className="mt-6">
                    <label className="text-slate-300 block mb-2 font-semibold flex items-center gap-2">
                      <Eye size={20} /> View Other Players' Hands:
                    </label>
                    <select
                      value={currentPlayerView}
                      onChange={(e) => setCurrentPlayerView(parseInt(e.target.value))}
                      className="px-4 py-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {players.map((player, index) => (
                        <option key={index} value={index}>{player.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="lg:col-span-1">
                <h3 className="text-xl font-semibold text-white mb-3">Game History</h3>
                <div className="bg-slate-700/50 p-4 rounded-xl h-96 overflow-y-auto">
                  {gameHistory.length > 0 ? gameHistory.map((round, index) => (
                    <div key={index} className="mb-4 pb-4 border-b border-slate-600 last:border-b-0">
                      <h4 className="font-bold text-white text-lg">Round {round.roundNumber}</h4>
                      <p className="text-slate-300 text-sm mt-1">Cards Played:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {round.cards.map((rc, rcIndex) => (
                          <div key={rcIndex} className="text-xs text-slate-200">
                            {rc.playerName}: <span className={`font-bold ${rc.card.suit === '♥' || rc.card.suit === '♦' ? 'text-red-400' : 'text-slate-100'}`}>{rc.card.rank}{rc.card.suit}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-yellow-400 font-semibold text-sm mt-2">Winner: {round.winner} ({round.winningCard.rank}{round.winningCard.suit})</p>
                    </div>
                  )) : (
                    <p className="text-slate-400 italic">No rounds played yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'game-end' && (
          <div className="bg-slate-800 bg-opacity-70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-slate-700 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
            <p className="text-slate-300 text-lg mb-6">{message}</p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={resetGame}
                className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 transition-colors"
              >
                Start New Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardGame;
