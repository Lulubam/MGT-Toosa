import React, { useState, useEffect } from 'react';
import { Users, Shuffle, Play, AlertCircle, Crown, Target, Trophy, Settings, Eye, EyeOff } from 'lucide-react';

const CardGame = () => {
  // Game state
  const [gameState, setGameState] = useState('setup'); // setup, dealing, playing, round-end
  const [players, setPlayers] = useState([
    { id: 1, name: 'Player 1', cards: [], points: 0, isDealer: false, optedOut: false, rings: { gold: 0, platinum: 0 } },
    { id: 2, name: 'Player 2', cards: [], points: 0, isDealer: false, optedOut: false, rings: { gold: 0, platinum: 0 } },
    { id: 3, name: 'Player 3', cards: [], points: 0, isDealer: false, optedOut: false, rings: { gold: 0, platinum: 0 } },
    { id: 4, name: 'Player 4', cards: [], points: 0, isDealer: false, optedOut: false, rings: { gold: 0, platinum: 0 } }
  ]);
  const [deck, setDeck] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dealerChoice, setDealerChoice] = useState(''); // 'straight' or 'flush'
  const [flushCount, setFlushCount] = useState(3);
  const [direction, setDirection] = useState('clockwise');
  const [callingCard, setCallingCard] = useState(null);
  const [playedCards, setPlayedCards] = useState([]);
  const [roundCards, setRoundCards] = useState([]);
  const [message, setMessage] = useState('Welcome! Set up the game to begin.');
  const [flushedCards, setFlushedCards] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(0); // For viewing specific player's cards

  // Enhanced UI states
  const [showAllCards, setShowAllCards] = useState(false);
  const [currentPlayerView, setCurrentPlayerView] = useState(0);
  const [roomCode, setRoomCode] = useState('');
  const [isOnlineMode, setIsOnlineMode] = useState(false);

  // Dealing states - Enhanced for proper two-round dealing
  const [manualDealing, setManualDealing] = useState(false);
  const [currentDealPlayer, setCurrentDealPlayer] = useState(0);
  const [dealRound, setDealRound] = useState(0); // 0-1 for two dealing rounds
  const [dealingToPlayer, setDealingToPlayer] = useState(null);
  const [cardsPerRound, setCardsPerRound] = useState([3, 2]); // First round: 3 cards, Second round: 2 cards
  const [currentRoundCardCount, setCurrentRoundCardCount] = useState(0);
  
  // Game history and player view
  const [gameHistory, setGameHistory] = useState([]);
  const [dealerSelectionPhase, setDealerSelectionPhase] = useState(true);
  const [dealerSelectionCards, setDealerSelectionCards] = useState([]);

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

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const initializeGame = () => {
    const newDeck = createDeck();
    setDeck(newDeck);
    setDealerSelectionPhase(true);
    
    // Each player draws a card to determine dealer
    const selectionCards = [];
    const newPlayers = [...players];
    
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
    
    let cardIndex = 0;
    const newPlayers = [...players];
    const newFlushedCards = [];
    
    // Handle flush cards if chosen
    if (dealerChoice === 'flush') {
      for (let i = 0; i < flushCount; i++) {
        newFlushedCards.push(deck[cardIndex]);
        cardIndex++;
      }
      setFlushedCards(newFlushedCards);
    }
    
    // Start manual dealing - dealer deals to next player first
    const dealerIndex = players.findIndex(p => p.isDealer);
    const firstPlayerToDeal = direction === 'clockwise' ? 
      (dealerIndex + 1) % players.length : 
      (dealerIndex - 1 + players.length) % players.length;
    
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
    let playerToReceive;
    
    if (targetPlayerId !== null) {
      // Manual selection - check for dealing foul
      if (targetPlayerId !== currentDealPlayer) {
        // Dealing foul - wrong player
        const dealerIndex = players.findIndex(p => p.isDealer);
        applyFoul(dealerIndex, "Dealing cards to wrong player!");
      }
      playerToReceive = targetPlayerId;
    } else {
      // Automatic dealing
      playerToReceive = currentDealPlayer;
    }
    
    // Deal card to selected player
    newPlayers[playerToReceive].cards.push(deck[0]);
    setPlayers(newPlayers);
    setDeck(deck.slice(1));
    setDealingToPlayer(null);
    
    // Move to next player in dealing order
    let nextPlayer;
    let nextRound = dealRound;
    let nextCardCount = currentRoundCardCount + 1;
    
    const activePlayers = players.filter(p => !p.optedOut);
    
    // Check if current player has received all cards for this round
    if (nextCardCount >= cardsPerRound[dealRound]) {
      // Move to next player
      nextPlayer = direction === 'clockwise' ? 
        (currentDealPlayer + 1) % players.length : 
        (currentDealPlayer - 1 + players.length) % players.length;
      
      // Skip opted out players
      while (players[nextPlayer].optedOut && nextPlayer !== players.findIndex(p => p.isDealer)) {
        nextPlayer = direction === 'clockwise' ? 
          (nextPlayer + 1) % players.length : 
          (nextPlayer - 1 + players.length) % players.length;
      }
      
      nextCardCount = 0;
      
      // Check if we've dealt to all players in this round (including dealer)
      const dealerIndex = players.findIndex(p => p.isDealer);
      if (nextPlayer === dealerIndex && currentDealPlayer !== dealerIndex) {
        // We're about to deal to dealer, but haven't dealt to them yet in this round
        // Continue with dealer
      } else if (currentDealPlayer === dealerIndex) {
        // We just finished dealing to the dealer, move to next round
        nextRound++;
        if (nextRound < cardsPerRound.length) {
          // Start next round with the player next to dealer
          nextPlayer = direction === 'clockwise' ? 
            (dealerIndex + 1) % players.length : 
            (dealerIndex - 1 + players.length) % players.length;
          
          while (players[nextPlayer].optedOut) {
            nextPlayer = direction === 'clockwise' ? 
              (nextPlayer + 1) % players.length : 
              (nextPlayer - 1 + players.length) % players.length;
          }
        }
      }
    } else {
      nextPlayer = currentDealPlayer;
    }
    
    setCurrentDealPlayer(nextPlayer);
    setDealRound(nextRound);
    setCurrentRoundCardCount(nextCardCount);
    
    // Check if dealing is complete
    if (nextRound >= cardsPerRound.length) {
      setManualDealing(false);
      setGameState('playing');
      
      // Set first player to play (next to dealer)
      const dealerIndex = players.findIndex(p => p.isDealer);
      const firstPlayer = direction === 'clockwise' ? 
        (dealerIndex + 1) % players.length : 
        (dealerIndex - 1 + players.length) % players.length;
      
      setCurrentPlayer(firstPlayer);
      setMessage(`Cards dealt! ${players[firstPlayer].name} starts the round by playing the calling card.`);
    } else {
      setMessage(`Dealing round ${nextRound + 1}/${cardsPerRound.length} (${cardsPerRound[nextRound]} cards). Next card to: ${newPlayers[nextPlayer].name} (Card ${nextCardCount + 1}/${cardsPerRound[nextRound]})`);
    }
  };

  const playCard = (playerId, cardIndex) => {
    if (playerId !== currentPlayer || players[playerId].optedOut) return;
    
    const player = players[playerId];
    const card = player.cards[cardIndex];
    
    // Validate play
    if (callingCard && card.suit !== callingCard.suit) {
      const hasCallingCardSuit = player.cards.some(c => c.suit === callingCard.suit);
      if (hasCallingCardSuit) {
        applyFoul(playerId, "Must follow calling card suit when you have it!");
        return;
      }
    }
    
    // Play the card
    const newPlayers = [...players];
    const playedCard = newPlayers[playerId].cards.splice(cardIndex, 1)[0];
    
    const newRoundCards = [...roundCards, { card: playedCard, playerId }];
    setRoundCards(newRoundCards);
    
    // Set calling card if first card of round
    if (!callingCard) {
      setCallingCard(playedCard);
    }
    
    setPlayers(newPlayers);
    
    // Move to next player
    let nextPlayer = direction === 'clockwise' ? 
      (currentPlayer + 1) % players.length : 
      (currentPlayer - 1 + players.length) % players.length;
    
    // Skip opted out players
    while (players[nextPlayer].optedOut && newRoundCards.length < players.filter(p => !p.optedOut).length) {
      nextPlayer = direction === 'clockwise' ? 
        (nextPlayer + 1) % players.length : 
        (nextPlayer - 1 + players.length) % players.length;
    }
    
    setCurrentPlayer(nextPlayer);
    
    // Check if round is complete
    if (newRoundCards.length === players.filter(p => !p.optedOut).length) {
      endRound(newRoundCards);
    }
  };

  const endRound = (roundCards) => {
    // Find winner (highest number of calling card suit)
    const callingCardSuit = callingCard.suit;
    const callingCardPlays = roundCards.filter(rc => rc.card.suit === callingCardSuit);
    
    let winner;
    if (callingCardPlays.length > 0) {
      winner = callingCardPlays.reduce((prev, current) => 
        getCardNumber(current.card.rank) > getCardNumber(prev.card.rank) ? current : prev
      );
    } else {
      winner = roundCards[0]; // First player if no calling card suit played
    }
    
    setCurrentPlayer(winner.playerId);
    
    // Check if this was the last round (all active players have 0 cards)
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
    // Add this round to history
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
    
    // This is the end of the round - all players have played all their cards
    const attackCard = winner.card;
    const attackValue = attackCard.value;
    
    let nextPlayerId = direction === 'clockwise' ? 
      (winner.playerId + 1) % players.length : 
      (winner.playerId - 1 + players.length) % players.length;
    
    // Skip opted out players for targeting
    while (players[nextPlayerId].optedOut) {
      nextPlayerId = direction === 'clockwise' ? 
        (nextPlayerId + 1) % players.length : 
        (nextPlayerId - 1 + players.length) % players.length;
    }
    
    // Apply damage to the next player
    const newPlayers = [...players];
    newPlayers[nextPlayerId].points += attackValue;
    
    // Award rings for perfect games
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
    
    // Set new dealer
    newPlayers.forEach(p => p.isDealer = false);
    newPlayers[winner.playerId].isDealer = true;
    
    setPlayers(newPlayers);
    
    // Reset round state
    setCallingCard(null);
    setRoundCards([]);
    
    // Check game end
    const activePlayers = newPlayers.filter(p => !p.optedOut);
    if (activePlayers.length <= 1) {
      setGameState('game-end');
      setMessage(activePlayers.length === 1 ? `${activePlayers[0].name} wins the game!` : 'Game over - no players remaining!');
    } else {
      setTimeout(() => startNewRound(), 3000);
    }
  };

  const startNewRound = () => {
    // Reset for new round
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
    setDealingToPlayer(null);
    
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

  const optOut = (playerId) => {
    const newPlayers = [...players];
    newPlayers[playerId].optedOut = true;
    setPlayers(newPlayers);
    setMessage(`${newPlayers[playerId].name} has opted out of the game.`);
  };

  // Enhanced Card Component with realistic styling
  const Card = ({ card, onClick, disabled = false, className = "" }) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    
    return (
      <div
        onClick={!disabled ? onClick : undefined}
        className={`
          relative w-16 h-24 bg-white rounded-lg shadow-lg border border-gray-300 
          cursor-pointer transform transition-all duration-200 
          ${!disabled ? 'hover:scale-105 hover:shadow-xl hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'}
          ${className}
        `}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          boxShadow: disabled ? 'none' : '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)'
        }}
      >
        {/* Corner values */}
        <div className={`absolute top-1 left-1 text-xs font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>
          {card.rank}
        </div>
        <div className={`absolute top-3 left-1 text-xs ${isRed ? 'text-red-600' : 'text-black'}`}>
          {card.suit}
        </div>
        
        {/* Center suit */}
        <div className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>
          {card.suit}
        </div>
        
        {/* Bottom corner (rotated) */}
        <div className={`absolute bottom-1 right-1 text-xs font-bold transform rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
          {card.rank}
        </div>
        <div className={`absolute bottom-3 right-1 text-xs transform rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
          {card.suit}
        </div>
        
        {/* Attack value indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {card.value}
        </div>
      </div>
    );
  };

  const CardBack = ({ className = "" }) => (
    <div className={`w-16 h-24 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-lg border border-blue-700 ${className}`}>
      <div className="w-full h-full flex items-center justify-center text-white opacity-30">
        <div className="text-2xl">🂠</div>
      </div>
    </div>
  );

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
            
            {/* Room controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAllCards(!showAllCards)}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                title={showAllCards ? "Hide all cards" : "Show all cards (Debug)"}
              >
                {showAllCards ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
              </button>
              <button
                onClick={() => setRoomCode(generateRoomCode())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Create Room
              </button>
              {roomCode && (
                <div className="px-3 py-2 bg-white/10 rounded-lg text-white font-mono">
                  Room: {roomCode}
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
                  <Play className="w-5 h-5" />
                  Draw Cards for Dealer
                </button>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-bold mb-2">Game Rules</h3>
                <ul className="text-green-100 text-sm space-y-1">
                  <li>• Deck: No 2s, J, Q, K, Jokers</li>
                  <li>• Dealing: 3 cards first round, 2 cards second round</li>
                  <li>• Player next to dealer plays calling card first</li>
                  <li>• Follow suit or play any card</li>
                  <li>• Reach 12 points = knockout</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Dealer Selection Phase */}
        {dealerSelectionPhase && dealerSelectionCards.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Dealer Selection</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {dealerSelectionCards.map((selection, index) => (
                <div key={index} className="text-center space-y-3">
                  <div className="text-white font-semibold">{players[selection.playerId].name}</div>
                  <Card card={selection.card} disabled={true} className="mx-auto" />
                </div>
              ))}
            </div>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => determineDealerFromCards(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
              >
                Highest Card Deals
              </button>
              <button 
                onClick={() => determineDealerFromCards(false)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
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
                className={`px-6 py-3 rounded-lg transition-all ${dealerChoice === 'straight' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                Serve Straight
              </button>
              <button 
                onClick={() => setDealerChoice('flush')}
                className={`px-6 py-3 rounded-lg transition-all ${dealerChoice === 'flush' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                Flush Cards
              </button>
              {dealerChoice === 'flush' && (
                <div className="flex items-center gap-2">
                  <label className="text-white">Cards:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="5" 
                    value={flushCount}
                    onChange={(e) => setFlushCount(parseInt(e.target.value) || 3)}
                    className="w-16 px-2 py-2 rounded-lg bg-white/20 text-white text-center border border-white/20"
                  />
                </div>
              )}
            </div>
            {dealerChoice && !manualDealing && (
              <button 
                onClick={dealCards}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2 transition-all"
              >
                <Shuffle className="w-5 h-5" />
                Start Manual Dealing
              </button>
            )}
            {manualDealing && (
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-white mb-4 font-semibold">
                    Dealing Round {dealRound + 1}/{cardsPerRound.length} - {cardsPerRound[dealRound]} cards per player
                  </div>
                  <div className="text-green-200 text-sm mb-4">
                    Current: {players[currentDealPlayer].name} (Card {currentRoundCardCount + 1}/{cardsPerRound[dealRound]})
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {players.filter(p => !p.optedOut).map((player, index) => (
                    <button
                      key={player.id}
                      onClick={() => setDealingToPlayer(index)}
                      className={`p-3 rounded-lg text-white transition-all ${
                        dealingToPlayer === index 
                          ? 'bg-yellow-600 shadow-lg' 
                          : player.id === players[currentDealPlayer].id
                          ? 'bg-green-600/50 border-2 border-green-400'
                          : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      {player.name}
                      <div className="text-xs opacity-80">
                        {player.cards.length} cards
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => dealSingleCard(dealingToPlayer)}
                    disabled={dealingToPlayer === null}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg hover:from-yellow-700 hover:to-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Deal Card to Selected Player
                  </button>
                  <button 
                    onClick={() => dealSingleCard()}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                  >
                    Auto Deal (Correct Order)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Flushed Cards */}
        {flushedCards.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Flushed Cards</h3>
            <div className="flex gap-3 flex-wrap justify-center">
              {flushedCards.map((card, index) => (
                <Card key={index} card={card} disabled={true} />
              ))}
            </div>
          </div>
        )}

        {/* Current Round */}
        {gameState === 'playing' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Current Round</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {callingCard && (
                <div className="space-y-3">
                  <div className="text-white font-semibold">Calling Card:</div>
                  <Card card={callingCard} disabled={true} className="mx-auto md:mx-0" />
                </div>
              )}
              
              {roundCards.length > 0 && (
                <div className="space-y-3">
                  <div className="text-white font-semibold">Played this round:</div>
                  <div className="flex gap-2 flex-wrap">
                    {roundCards.map((rc, index) => (
                      <div key={index} className="text-center space-y-2">
                        <Card card={rc.card} disabled={true} />
                        <div className="text-xs text-green-200">{players[rc.playerId].name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Player Hand Selector */}
        {gameState === 'playing' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Your Hand</h3>
              <div className="flex gap-2">
                {players.map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => setCurrentPlayerView(index)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      currentPlayerView === index 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Player's Cards */}
            {players[currentPlayerView].cards.length > 0 ? (
              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap justify-center">
                  {players[currentPlayerView].cards.map((card, cardIndex) => (
                    <Card
                      key={cardIndex}
                      card={card}
                      onClick={() => playCard(currentPlayerView, cardIndex)}
                      disabled={currentPlayerView !== currentPlayer || players[currentPlayerView].optedOut}
                      className={currentPlayerView === currentPlayer && !players[currentPlayerView].optedOut ? 'hover:scale-110' : ''}
                    />
                  ))}
                </div>
                
                {currentPlayerView !== currentPlayer && !players[currentPlayerView].optedOut && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600/20 rounded-lg text-yellow-200">
                      <AlertCircle className="w-4 h-4" />
                      Wait for your turn to play cards
                    </div>
                  </div>
                )}
                
                {currentPlayerView === currentPlayer && !players[currentPlayerView].optedOut && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 rounded-lg text-green-200">
                      <Target className="w-4 h-4" />
                      Your turn - Select a card to play
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                No cards in hand
              </div>
            )}
          </div>
        )}

        {/* Players Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {players.map((player, index) => (
            <div 
              key={player.id} 
              className={`
                relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border transition-all
                ${player.optedOut ? 'opacity-50 border-red-500/30' : 'border-white/20'}
                ${index === currentPlayer && !player.optedOut ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20' : ''}
              `}
            >
              {/* Player Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Users className="w-6 h-6 text-white" />
                  {player.isDealer && <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{player.name}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    {player.isDealer && <span className="text-yellow-400">Dealer</span>}
                    {player.optedOut && <span className="text-red-400">Out</span>}
                    {index === currentPlayer && !player.optedOut && <span className="text-green-400">Turn</span>}
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-green-100">Points:</span>
                  <span className={`font-bold ${player.points >= 10 ? 'text-red-400' : 'text-white'}`}>
                    {player.points}/12
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-green-100">Cards:</span>
                  <span className="text-white font-bold">{player.cards.length}</span>
                </div>
                
                {/* Rings */}
                {(player.rings.gold > 0 || player.rings.platinum > 0) && (
                  <div className="flex justify-between">
                    <span className="text-green-100">Rings:</span>
                    <div className="flex items-center gap-2">
                      {player.rings.platinum > 0 && (
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-400 font-bold">{player.rings.platinum}</span>
                        </div>
                      )}
                      {player.rings.gold > 0 && (
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-bold">{player.rings.gold}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Card Preview */}
              {(showAllCards || index === currentPlayerView) && player.cards.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-green-200 mb-2">Cards:</div>
                  <div className="flex gap-1 flex-wrap">
                    {player.cards.slice(0, 5).map((card, cardIndex) => (
                      <div key={cardIndex} className="w-8 h-12 text-xs">
                        <Card card={card} disabled={true} className="!w-8 !h-12 !text-xs" />
                      </div>
                    ))}
                    {player.cards.length > 5 && (
                      <div className="w-8 h-12 bg-white/10 rounded text-white text-xs flex items-center justify-center">
                        +{player.cards.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              {gameState === 'playing' && !player.optedOut && (
                <button
                  onClick={() => optOut(index)}
                  className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-sm transition-colors border border-red-500/30"
                >
                  Opt Out
                </button>
              )}
              
              {/* Points Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      player.points >= 10 ? 'bg-red-500' : player.points >= 6 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(player.points / 12) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Game History */}
        {gameHistory.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Previous Rounds</h3>
            <div className="max-h-80 overflow-y-auto space-y-4">
              {gameHistory.map((round, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-white font-semibold">Round {round.roundNumber}</div>
                    <div className="text-green-300 text-sm">
                      Winner: {round.winner}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {round.cards.map((cardPlay, cardIndex) => (
                      <div key={cardIndex} className="text-center space-y-2">
                        <Card card={cardPlay.card} disabled={true} className="mx-auto !w-12 !h-16" />
                        <div className="text-xs text-green-200">{cardPlay.playerName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Rules */}
        <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Game Rules Summary</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-green-100 text-sm">
            <div>
              <h4 className="font-semibold text-white mb-2">Card Values</h4>
              <ul className="space-y-1">
                <li>• 3♠ = 12 points</li>
                <li>• Other 3s = 6 points</li>
                <li>• 4s = 4 points</li>
                <li>• Aces = 2 points</li>
                <li>• Others = 1 point</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Dealing</h4>
              <ul className="space-y-1">
                <li>• Round 1: 3 cards each</li>
                <li>• Round 2: 2 cards each</li>
                <li>• Dealer deals to next player first</li>
                <li>• Dealer receives cards last</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Gameplay</h4>
              <ul className="space-y-1">
                <li>• Follow calling card suit</li>
                <li>• Winner attacks next player</li>
                <li>• 12+ points = knockout</li>
                <li>• Fouls = +2 points</li>
                <li>• Win with 0 points = Ring!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardGame;
