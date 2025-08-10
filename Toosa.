import React, { useState, useEffect } from 'react';
import { Users, Shuffle, Play, AlertCircle, Crown, Target } from 'lucide-react';

const CardGame = () => {
  // Game state
  const [gameState, setGameState] = useState('setup'); // setup, dealing, playing, round-end
  const [players, setPlayers] = useState([
    { id: 1, name: 'Player 1', cards: [], points: 0, isDealer: false, optedOut: false },
    { id: 2, name: 'Player 2', cards: [], points: 0, isDealer: false, optedOut: false },
    { id: 3, name: 'Player 3', cards: [], points: 0, isDealer: false, optedOut: false },
    { id: 4, name: 'Player 4', cards: [], points: 0, isDealer: false, optedOut: false }
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

  // Manual dealing state
  const [manualDealing, setManualDealing] = useState(false);
  const [currentDealPlayer, setCurrentDealPlayer] = useState(0);
  const [dealRound, setDealRound] = useState(0);
  const [dealingToPlayer, setDealingToPlayer] = useState(null);
  
  // Game history and player view
  const [gameHistory, setGameHistory] = useState([]);
  const [currentPlayerView, setCurrentPlayerView] = useState(0);
  const [dealerSelectionPhase, setDealerSelectionPhase] = useState(true);
  const [dealerSelectionCards, setDealerSelectionCards] = useState([]);

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
    
    // Start manual dealing
    setManualDealing(true);
    setCurrentDealPlayer(0);
    setDealRound(0);
    setDeck(deck.slice(cardIndex));
    setMessage(`Manual dealing started. Click "Deal Card" to give cards one by one.`);
  };

  const dealSingleCard = (targetPlayerId = null) => {
    if (!manualDealing || deck.length === 0) return;
    
    const newPlayers = [...players];
    let playerToReceive;
    
    if (targetPlayerId !== null) {
      // Manual selection - check for dealing foul
      const expectedPlayerIndex = direction === 'clockwise' ? currentDealPlayer : (players.length - 1 - currentDealPlayer);
      let expectedPlayer = expectedPlayerIndex;
      let attempts = 0;
      
      // Find the expected active player
      while (players[expectedPlayer].optedOut && attempts < players.length) {
        expectedPlayer = direction === 'clockwise' ? 
          (expectedPlayer + 1) % players.length : 
          (expectedPlayer - 1 + players.length) % players.length;
        attempts++;
      }
      
      if (targetPlayerId !== expectedPlayer) {
        // Dealing foul - wrong player
        const dealerIndex = players.findIndex(p => p.isDealer);
        applyFoul(dealerIndex, "Dealing cards to wrong player!");
      }
      
      playerToReceive = targetPlayerId;
    } else {
      // Automatic dealing
      const playerIndex = direction === 'clockwise' ? currentDealPlayer : (players.length - 1 - currentDealPlayer);
      let actualPlayerIndex = playerIndex;
      let attempts = 0;
      
      while (players[actualPlayerIndex].optedOut && attempts < players.length) {
        actualPlayerIndex = direction === 'clockwise' ? 
          (actualPlayerIndex + 1) % players.length : 
          (actualPlayerIndex - 1 + players.length) % players.length;
        attempts++;
      }
      
      playerToReceive = actualPlayerIndex;
    }
    
    // Deal card to selected player
    newPlayers[playerToReceive].cards.push(deck[0]);
    setPlayers(newPlayers);
    setDeck(deck.slice(1));
    setDealingToPlayer(null);
    
    // Move to next player in dealing order
    let nextPlayer = (currentDealPlayer + 1) % players.length;
    let nextRound = dealRound;
    
    const activePlayers = players.filter(p => !p.optedOut);
    if (currentDealPlayer >= activePlayers.length - 1) {
      nextPlayer = 0;
      nextRound++;
    }
    
    setCurrentDealPlayer(nextPlayer);
    setDealRound(nextRound);
    
    // Check if dealing is complete
    if (nextRound >= 3) {
      setManualDealing(false);
      setGameState('playing');
      const dealerIndex = players.findIndex(p => p.isDealer);
      setCurrentPlayer(dealerIndex);
      setMessage(`Cards dealt! ${players[dealerIndex].name} starts the round.`);
    } else {
      const nextExpectedPlayer = direction === 'clockwise' ? nextPlayer : (players.length - 1 - nextPlayer);
      setMessage(`Dealing round ${nextRound + 1}/3. Next card should go to: ${newPlayers[nextExpectedPlayer].name}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded border-2 border-gray-300 flex items-center justify-center text-black font-bold text-sm">♠</div>
            Card Game
          </h1>
          <p className="text-green-100">{message}</p>
        </div>

        {/* Game Setup */}
        {gameState === 'setup' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Game Setup</h2>
            <div className="flex gap-4 mb-4">
              <select 
                value={direction} 
                onChange={(e) => setDirection(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/20 text-white"
              >
                <option value="clockwise">Clockwise</option>
                <option value="anticlockwise">Anticlockwise</option>
              </select>
              <button 
                onClick={initializeGame}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Draw Cards for Dealer
              </button>
            </div>
          </div>
        )}

        {/* Dealer Selection Phase */}
        {dealerSelectionPhase && dealerSelectionCards.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Dealer Selection</h2>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {dealerSelectionCards.map((selection, index) => (
                <div key={index} className="text-center">
                  <div className="text-white mb-2">{players[selection.playerId].name}</div>
                  <div className="bg-white rounded-lg p-3 min-w-20">
                    <div className={`font-bold text-lg ${selection.card.suit === '♥' || selection.card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                      {selection.card.rank}
                    </div>
                    <div className={`text-xl ${selection.card.suit === '♥' || selection.card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                      {selection.card.suit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => determineDealerFromCards(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Highest Card Deals
              </button>
              <button 
                onClick={() => determineDealerFromCards(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lowest Card Deals
              </button>
            </div>
          </div>
        )}

        {/* Dealing Phase */}
        {gameState === 'dealing' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Dealer's Choice</h2>
            <div className="flex gap-4 mb-4">
              <button 
                onClick={() => setDealerChoice('straight')}
                className={`px-4 py-2 rounded-lg ${dealerChoice === 'straight' ? 'bg-blue-600' : 'bg-white/20'} text-white`}
              >
                Serve Straight
              </button>
              <button 
                onClick={() => setDealerChoice('flush')}
                className={`px-4 py-2 rounded-lg ${dealerChoice === 'flush' ? 'bg-blue-600' : 'bg-white/20'} text-white`}
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
                  className="w-16 px-2 py-2 rounded-lg bg-white/20 text-white text-center"
                />
              )}
            </div>
            {dealerChoice && !manualDealing && (
              <button 
                onClick={dealCards}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Start Manual Dealing
              </button>
            )}
            {manualDealing && (
              <div className="space-y-4">
                <div className="text-white mb-2">
                  Dealing Round {dealRound + 1}/3 - Select player to receive card:
                </div>
                <div className="flex gap-2 mb-4">
                  {players.filter(p => !p.optedOut).map((player, index) => (
                    <button
                      key={player.id}
                      onClick={() => setDealingToPlayer(index)}
                      className={`px-3 py-2 rounded-lg text-white ${dealingToPlayer === index ? 'bg-yellow-600' : 'bg-white/20'}`}
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => dealSingleCard(dealingToPlayer)}
                    disabled={dealingToPlayer === null}
                    className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Deal Card to Selected Player
                  </button>
                  <button 
                    onClick={() => dealSingleCard()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-2">Flushed Cards</h3>
            <div className="flex gap-2">
              {flushedCards.map((card, index) => (
                <div key={index} className="bg-white rounded-lg p-2 text-center min-w-16">
                  <div className={`font-bold ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                    {card.rank}
                  </div>
                  <div className={card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}>
                    {card.suit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Round */}
        {gameState === 'playing' && callingCard && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-2">Current Round</h3>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-white">Calling Card:</span>
              <div className="bg-white rounded-lg p-2 text-center min-w-16">
                <div className={`font-bold ${callingCard.suit === '♥' || callingCard.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                  {callingCard.rank}
                </div>
                <div className={callingCard.suit === '♥' || callingCard.suit === '♦' ? 'text-red-600' : 'text-black'}>
                  {callingCard.suit}
                </div>
              </div>
            </div>
            {roundCards.length > 0 && (
              <div>
                <span className="text-white mb-2 block">Played this round:</span>
                <div className="flex gap-2">
                  {roundCards.map((rc, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-white rounded-lg p-2 min-w-16 mb-1">
                        <div className={`font-bold ${rc.card.suit === '♥' || rc.card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                          {rc.card.rank}
                        </div>
                        <div className={rc.card.suit === '♥' || rc.card.suit === '♦' ? 'text-red-600' : 'text-black'}>
                          {rc.card.suit}
                        </div>
                      </div>
                      <div className="text-xs text-green-100">{players[rc.playerId].name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Player Card Selector - Only show current player's cards */}
        {gameState === 'playing' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Select Your Player View</h3>
            <div className="flex gap-2 mb-4">
              {players.map((player, index) => (
                <button
                  key={player.id}
                  onClick={() => setCurrentPlayerView(index)}
                  className={`px-3 py-2 rounded-lg ${currentPlayerView === index ? 'bg-blue-600' : 'bg-white/20'} text-white text-sm`}
                >
                  {player.name}
                </button>
              ))}
            </div>
            
            {/* Only show cards for the selected player view */}
            {players[currentPlayerView].cards.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-green-200">Your cards:</div>
                <div className="flex flex-wrap gap-2">
                  {players[currentPlayerView].cards.map((card, cardIndex) => (
                    <button
                      key={cardIndex}
                      onClick={() => playCard(currentPlayerView, cardIndex)}
                      disabled={currentPlayerView !== currentPlayer || players[currentPlayerView].optedOut}
                      className="bg-white rounded p-2 text-sm min-w-16 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className={`font-bold ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                        {card.rank}
                      </div>
                      <div className={card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}>
                        {card.suit}
                      </div>
                      <div className="text-gray-600 text-xs">({card.value})</div>
                    </button>
                  ))}
                </div>
                {currentPlayerView !== currentPlayer && !players[currentPlayerView].optedOut && (
                  <div className="text-yellow-200 text-sm mt-2">
                    Wait for your turn to play cards
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Game History */}
        {gameHistory.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Previous Rounds</h3>
            <div className="max-h-60 overflow-y-auto space-y-3">
              {gameHistory.map((round, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3">
                  <div className="text-white font-semibold mb-2">Round {round.roundNumber}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                    {round.cards.map((cardPlay, cardIndex) => (
                      <div key={cardIndex} className="text-center">
                        <div className="bg-white rounded p-1 mb-1 min-w-12">
                          <div className={`font-bold text-xs ${cardPlay.card.suit === '♥' || cardPlay.card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                            {cardPlay.card.rank}
                          </div>
                          <div className={`text-xs ${cardPlay.card.suit === '♥' || cardPlay.card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                            {cardPlay.card.suit}
                          </div>
                        </div>
                        <div className="text-xs text-green-100">{cardPlay.playerName}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-green-200 text-sm">
                    Winner: {round.winner} with {round.winningCard.rank}{round.winningCard.suit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {players.map((player, index) => (
            <div key={player.id} className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 ${player.optedOut ? 'opacity-50' : ''} ${index === currentPlayer && !player.optedOut ? 'ring-2 ring-yellow-400' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white">{player.name}</h3>
                {player.isDealer && <Crown className="w-4 h-4 text-yellow-400" />}
                {player.optedOut && <Target className="w-4 h-4 text-red-400" />}
              </div>
              
              <div className="text-sm text-green-100 mb-2">
                Points: {player.points}/12
              </div>
              
              <div className="text-sm text-green-100 mb-3">
                Cards: {player.cards.length}
              </div>
              
              {/* Player actions */}
              {gameState === 'playing' && !player.optedOut && (
                <button
                  onClick={() => optOut(index)}
                  className="mt-2 px-3 py-1 bg-red-600/50 text-white rounded text-xs hover:bg-red-600"
                >
                  Opt Out
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Game Rules */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">Game Rules Summary</h3>
          <div className="text-green-100 text-sm space-y-2">
            <p><strong>Card Values:</strong> 3♠=12, other 3s=6, 4s=4, Aces=2, rest=1</p>
            <p><strong>Goal:</strong> Avoid reaching 12 points. Last card attack can knock players out.</p>
            <p><strong>Play:</strong> Follow calling card suit if you have it, otherwise any card.</p>
            <p><strong>Fouls (2 points):</strong> Playing out of turn, wrong cards, not following suit when able.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardGame;
