import React, { useState, useEffect, useRef } from 'react';
import { Skull, Swords, Heart, Zap, Shield, Moon, Sun } from 'lucide-react';

const RoninGame = () => {
  const [gameState, setGameState] = useState('menu'); // menu, story, combat, victory, defeat, ending
  const [playerStats, setPlayerStats] = useState({
    health: 100,
    maxHealth: 100,
    posture: 0,
    maxPosture: 100,
    corruption: 0,
    souls: 0
  });
  
  const [bossStats, setBossStats] = useState({
    health: 200,
    maxHealth: 200,
    posture: 0,
    maxPosture: 150,
    phase: 1
  });
  
  const [selectedPath, setSelectedPath] = useState(null); // samurai, shadow, demon
  const [currentBoss, setCurrentBoss] = useState(0);
  const [combatLog, setCombatLog] = useState([]);
  const [isBlocking, setIsBlocking] = useState(false);
  const [canAct, setCanAct] = useState(true);
  const canvasRef = useRef(null);
  
  const bosses = [
    { name: "Kuro le Traître", title: "Premier Seigneur Déchu", difficulty: 1 },
    { name: "Yuki la Fantôme", title: "Deuxième Seigneur Déchu", difficulty: 1.5 },
    { name: "Akuma l'Oni", title: "Seigneur Démon Final", difficulty: 2 }
  ];

  // Animation du background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: Math.random() * 0.5 + 0.2
      });
    }
    
    let animationId;
    const animate = () => {
      ctx.fillStyle = 'rgba(20, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 100, 100, ${Math.random() * 0.5 + 0.3})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        p.x += p.speedX;
        p.y += p.speedY;
        
        if (p.y > canvas.height) {
          p.y = 0;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0 || p.x > canvas.width) {
          p.x = Math.random() * canvas.width;
        }
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationId);
  }, []);

  const addLog = (message, type = 'normal') => {
    setCombatLog(prev => [...prev.slice(-4), { message, type, id: Date.now() }]);
  };

  const startGame = (path) => {
    setSelectedPath(path);
    setGameState('story');
    setPlayerStats({
      health: 100,
      maxHealth: 100,
      posture: 0,
      maxPosture: 100,
      corruption: 0,
      souls: 0
    });
  };

  const startCombat = () => {
    setGameState('combat');
    setBossStats({
      health: 200 * bosses[currentBoss].difficulty,
      maxHealth: 200 * bosses[currentBoss].difficulty,
      posture: 0,
      maxPosture: 150 * bosses[currentBoss].difficulty,
      phase: 1
    });
    setCombatLog([]);
    addLog(`${bosses[currentBoss].name} apparaît dans la brume...`, 'boss');
  };

  const playerAttack = () => {
    if (!canAct) return;
    setCanAct(false);
    
    const damage = Math.floor(Math.random() * 15) + 10;
    const postureDamage = Math.floor(Math.random() * 20) + 15;
    
    setBossStats(prev => ({
      ...prev,
      health: Math.max(0, prev.health - damage),
      posture: Math.min(prev.maxPosture, prev.posture + postureDamage)
    }));
    
    addLog(`Vous frappez pour ${damage} dégâts!`, 'player');
    
    setTimeout(() => {
      if (bossStats.health - damage <= 0) {
        victory();
      } else {
        bossAttack();
      }
    }, 800);
  };

  const playerParry = () => {
    if (!canAct) return;
    setCanAct(false);
    
    const success = Math.random() > 0.4;
    
    if (success) {
      const postureDamage = Math.floor(Math.random() * 30) + 25;
      setBossStats(prev => ({
        ...prev,
        posture: Math.min(prev.maxPosture, prev.posture + postureDamage)
      }));
      addLog('Parade parfaite! Posture brisée!', 'success');
      
      if (bossStats.posture + postureDamage >= bossStats.maxPosture) {
        addLog('EXÉCUTION CRITIQUE!', 'critical');
        const critDamage = Math.floor(bossStats.maxHealth * 0.3);
        setBossStats(prev => ({
          ...prev,
          health: Math.max(0, prev.health - critDamage),
          posture: 0
        }));
        
        setTimeout(() => {
          if (bossStats.health - critDamage <= 0) {
            victory();
          } else {
            setCanAct(true);
          }
        }, 1000);
        return;
      }
    } else {
      addLog('Parade ratée!', 'damage');
    }
    
    setTimeout(() => {
      bossAttack();
    }, 800);
  };

  const playerDodge = () => {
    if (!canAct) return;
    setCanAct(false);
    
    const success = Math.random() > 0.3;
    
    if (success) {
      addLog('Esquive réussie!', 'success');
      setPlayerStats(prev => ({
        ...prev,
        posture: Math.max(0, prev.posture - 15)
      }));
    } else {
      addLog('Esquive ratée!', 'damage');
    }
    
    setTimeout(() => {
      bossAttack();
    }, 800);
  };

  const useOniPower = () => {
    if (!canAct || playerStats.corruption >= 100) return;
    setCanAct(false);
    
    const damage = Math.floor(Math.random() * 30) + 25;
    const corruption = Math.floor(Math.random() * 15) + 10;
    
    setBossStats(prev => ({
      ...prev,
      health: Math.max(0, prev.health - damage)
    }));
    
    setPlayerStats(prev => ({
      ...prev,
      corruption: Math.min(100, prev.corruption + corruption)
    }));
    
    addLog(`Pouvoir Oni: ${damage} dégâts! [+${corruption} corruption]`, 'oni');
    
    setTimeout(() => {
      if (bossStats.health - damage <= 0) {
        victory();
      } else {
        bossAttack();
      }
    }, 800);
  };

  const bossAttack = () => {
    const attacks = ['coupe rapide', 'frappe lourde', 'combo mortel'];
    const attack = attacks[Math.floor(Math.random() * attacks.length)];
    
    let damage = Math.floor(Math.random() * 20) + 15;
    let postureDamage = Math.floor(Math.random() * 25) + 20;
    
    if (isBlocking) {
      damage = Math.floor(damage * 0.5);
      addLog(`${bosses[currentBoss].name} attaque! Bloqué! -${damage} PV`, 'damage');
    } else {
      addLog(`${bosses[currentBoss].name} utilise ${attack}! -${damage} PV`, 'damage');
    }
    
    setPlayerStats(prev => ({
      ...prev,
      health: Math.max(0, prev.health - damage),
      posture: Math.min(prev.maxPosture, prev.posture + postureDamage)
    }));
    
    setTimeout(() => {
      if (playerStats.health - damage <= 0) {
        defeat();
      } else {
        setCanAct(true);
      }
    }, 800);
  };

  const victory = () => {
    const souls = Math.floor(Math.random() * 500) + 300;
    setPlayerStats(prev => ({
      ...prev,
      souls: prev.souls + souls
    }));
    addLog(`Victoire! +${souls} âmes`, 'victory');
    
    setTimeout(() => {
      if (currentBoss < bosses.length - 1) {
        setCurrentBoss(prev => prev + 1);
        setGameState('victory');
      } else {
        setGameState('ending');
      }
    }, 2000);
  };

  const defeat = () => {
    setGameState('defeat');
    addLog('Vous êtes tombé...', 'death');
  };

  const getEnding = () => {
    if (playerStats.corruption >= 70) {
      return {
        title: "FIN DÉMONIAQUE",
        text: "Vous avez embrassé la malédiction. Le Ronin n'existe plus. Seul l'Oni demeure, maître des ombres et terreur du Japon.",
        color: "text-red-600"
      };
    } else if (playerStats.corruption <= 30) {
      return {
        title: "FIN DE RÉDEMPTION",
        text: "Vous avez brisé la malédiction et retrouvé votre humanité. Le Ronin erre désormais, libre mais marqué à jamais.",
        color: "text-blue-400"
      };
    } else {
      return {
        title: "FIN ÉQUILIBRE",
        text: "Entre ombre et lumière, vous avez trouvé votre voie. Le Ronin vit avec ses démons, mais ne leur appartient pas.",
        color: "text-purple-400"
      };
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-serif">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
        {gameState === 'menu' && (
          <div className="text-center space-y-8 max-w-2xl">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-red-600 tracking-wider drop-shadow-2xl">
                RONIN
              </h1>
              <p className="text-2xl text-red-400 tracking-widest">Shadow of the Fallen</p>
            </div>
            
            <p className="text-gray-300 text-lg leading-relaxed px-8">
              Trahi par votre clan, maudit par un Oni, vous revenez des ténèbres. 
              Votre lame assoiffée de vengeance doit choisir: sauver votre humanité ou embrasser le démon.
            </p>
            
            <div className="space-y-4 pt-8">
              <p className="text-red-300 text-sm tracking-wide">CHOISISSEZ VOTRE VOIE</p>
              
              <button
                onClick={() => startGame('samurai')}
                className="w-full max-w-md px-8 py-4 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded border-2 border-blue-400 hover:border-blue-300 transition-all transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <Swords size={24} />
                <div className="text-left">
                  <div className="font-bold">VOIE DU SAMOURAÏ</div>
                  <div className="text-xs text-blue-200">Honneur • Discipline • Rédemption</div>
                </div>
              </button>
              
              <button
                onClick={() => startGame('shadow')}
                className="w-full max-w-md px-8 py-4 bg-gradient-to-r from-purple-900 to-purple-700 text-white rounded border-2 border-purple-400 hover:border-purple-300 transition-all transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <Moon size={24} />
                <div className="text-left">
                  <div className="font-bold">VOIE DE L'OMBRE</div>
                  <div className="text-xs text-purple-200">Furtivité • Équilibre • Pragmatisme</div>
                </div>
              </button>
              
              <button
                onClick={() => startGame('demon')}
                className="w-full max-w-md px-8 py-4 bg-gradient-to-r from-red-900 to-red-700 text-white rounded border-2 border-red-400 hover:border-red-300 transition-all transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <Skull size={24} />
                <div className="text-left">
                  <div className="font-bold">VOIE DU DÉMON</div>
                  <div className="text-xs text-red-200">Pouvoir • Rage • Damnation</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {gameState === 'story' && (
          <div className="text-center space-y-8 max-w-2xl">
            <h2 className="text-4xl font-bold text-red-500">Chapitre I</h2>
            <p className="text-gray-300 text-lg leading-relaxed px-4">
              Les villages brûlent. Les temples s'effondrent. Les Seigneurs Déchus ont plongé le Japon dans les ténèbres.
              <br /><br />
              Votre katana vibre de soif de sang. La malédiction murmure à votre oreille.
              <br /><br />
              Le premier des traîtres vous attend dans la forêt maudite...
            </p>
            
            <button
              onClick={startCombat}
              className="px-8 py-4 bg-red-900 text-white rounded border-2 border-red-500 hover:bg-red-800 transition-all transform hover:scale-105"
            >
              AFFRONTER {bosses[currentBoss].name.toUpperCase()}
            </button>
          </div>
        )}

        {gameState === 'combat' && (
          <div className="w-full max-w-4xl space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-red-400">{bosses[currentBoss].name}</h2>
              <p className="text-sm text-gray-400 tracking-wide">{bosses[currentBoss].title}</p>
            </div>
            
            {/* Boss Stats */}
            <div className="bg-black bg-opacity-50 p-4 rounded border border-red-900 space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-400">Santé du Boss</span>
                  <span className="text-red-300">{bossStats.health} / {bossStats.maxHealth}</span>
                </div>
                <div className="w-full bg-gray-900 rounded h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-300"
                    style={{ width: `${(bossStats.health / bossStats.maxHealth) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-yellow-400">Posture du Boss</span>
                  <span className="text-yellow-300">{bossStats.posture} / {bossStats.maxPosture}</span>
                </div>
                <div className="w-full bg-gray-900 rounded h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full transition-all duration-300"
                    style={{ width: `${(bossStats.posture / bossStats.maxPosture) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Player Stats */}
            <div className="bg-black bg-opacity-50 p-4 rounded border border-blue-900 space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-400">Votre Santé</span>
                  <span className="text-green-300">{playerStats.health} / {playerStats.maxHealth}</span>
                </div>
                <div className="w-full bg-gray-900 rounded h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-green-400 h-full transition-all duration-300"
                    style={{ width: `${(playerStats.health / playerStats.maxHealth) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-400">Votre Posture</span>
                  <span className="text-blue-300">{playerStats.posture} / {playerStats.maxPosture}</span>
                </div>
                <div className="w-full bg-gray-900 rounded h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-300"
                    style={{ width: `${(playerStats.posture / playerStats.maxPosture) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-400">Corruption Oni</span>
                  <span className="text-red-300">{playerStats.corruption}%</span>
                </div>
                <div className="w-full bg-gray-900 rounded h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-red-600 h-full transition-all duration-300"
                    style={{ width: `${playerStats.corruption}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Combat Log */}
            <div className="bg-black bg-opacity-70 p-3 rounded border border-gray-800 h-24 overflow-hidden">
              {combatLog.slice(-3).map((log) => (
                <div 
                  key={log.id}
                  className={`text-sm mb-1 ${
                    log.type === 'player' ? 'text-cyan-400' :
                    log.type === 'damage' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'critical' ? 'text-yellow-300 font-bold' :
                    log.type === 'oni' ? 'text-purple-400' :
                    log.type === 'boss' ? 'text-red-500 font-bold' :
                    'text-gray-400'
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={playerAttack}
                disabled={!canAct}
                className="px-6 py-3 bg-red-900 text-white rounded border-2 border-red-600 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Swords size={20} />
                ATTAQUER
              </button>
              
              <button
                onClick={playerParry}
                disabled={!canAct}
                className="px-6 py-3 bg-yellow-900 text-white rounded border-2 border-yellow-600 hover:bg-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Shield size={20} />
                PARER
              </button>
              
              <button
                onClick={playerDodge}
                disabled={!canAct}
                className="px-6 py-3 bg-blue-900 text-white rounded border-2 border-blue-600 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Zap size={20} />
                ESQUIVER
              </button>
              
              <button
                onClick={useOniPower}
                disabled={!canAct || playerStats.corruption >= 100}
                className="px-6 py-3 bg-purple-900 text-white rounded border-2 border-purple-600 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Skull size={20} />
                POUVOIR ONI
              </button>
            </div>
            
            <div className="text-center">
              <button
                onMouseDown={() => setIsBlocking(true)}
                onMouseUp={() => setIsBlocking(false)}
                onMouseLeave={() => setIsBlocking(false)}
                className={`px-8 py-2 rounded border-2 transition-all ${
                  isBlocking 
                    ? 'bg-gray-700 border-gray-400 text-gray-200' 
                    : 'bg-gray-900 border-gray-600 text-gray-400'
                }`}
              >
                {isBlocking ? 'BLOCAGE ACTIF' : 'MAINTENIR POUR BLOQUER'}
              </button>
            </div>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="text-center space-y-8 max-w-2xl">
            <h2 className="text-5xl font-bold text-yellow-400">VICTOIRE</h2>
            <p className="text-gray-300 text-lg">
              {bosses[currentBoss - 1]?.name} tombe dans la poussière.
              <br />
              La malédiction se renforce...
            </p>
            
            <div className="space-y-2 text-gray-400">
              <p>Âmes collectées: {playerStats.souls}</p>
              <p>Corruption: {playerStats.corruption}%</p>
            </div>
            
            <button
              onClick={startCombat}
              className="px-8 py-4 bg-red-900 text-white rounded border-2 border-red-500 hover:bg-red-800 transition-all transform hover:scale-105"
            >
              CONTINUER VOTRE QUÊTE
            </button>
          </div>
        )}

        {gameState === 'defeat' && (
          <div className="text-center space-y-8 max-w-2xl">
            <h2 className="text-5xl font-bold text-red-600">VOUS ÊTES MORT</h2>
            <p className="text-gray-400 text-lg">
              Les ténèbres vous engloutissent...
              <br />
              Mais un Ronin maudit ne meurt jamais vraiment.
            </p>
            
            <button
              onClick={() => {
                setGameState('combat');
                setPlayerStats(prev => ({
                  ...prev,
                  health: prev.maxHealth,
                  posture: 0
                }));
                setBossStats({
                  health: 200 * bosses[currentBoss].difficulty,
                  maxHealth: 200 * bosses[currentBoss].difficulty,
                  posture: 0,
                  maxPosture: 150 * bosses[currentBoss].difficulty,
                  phase: 1
                });
                setCombatLog([]);
                addLog('Vous revenez des ténèbres...', 'success');
              }}
              className="px-8 py-4 bg-gray-900 text-white rounded border-2 border-gray-600 hover:bg-gray-800 transition-all transform hover:scale-105"
            >
              RESSUSCITER
            </button>
          </div>
        )}

        {gameState === 'ending' && (
          <div className="text-center space-y-8 max-w-2xl">
            <h2 className={`text-5xl font-bold ${getEnding().color}`}>
              {getEnding().title}
            </h2>
            
            <p className="text-gray-300 text-xl leading-relaxed px-4">
              {getEnding().text}
            </p>
            
            <div className="space-y-2 text-gray-400 pt-4">
              <p>Corruption finale: {playerStats.corruption}%</p>
              <p>Âmes collectées: {playerStats.souls}</p>
              <p>Voie choisie: {selectedPath === 'samurai' ? 'Samouraï' : selectedPath === 'shadow' ? 'Ombre' : 'Démon'}</p>
            </div>
            
            <button
              onClick={() => {
                setGameState('menu');
                setCurrentBoss(0);
                setPlayerStats({
                  health: 100,
                  maxHealth: 100,
                  posture: 0,
                  maxPosture: 100,
                  corruption: 0,
                  souls: 0
                });
              }}
              className="px-8 py-4 bg-red-900 text-white rounded border-2 border-red-500 hover:bg-red-800 transition-all transform hover:scale-105"
            >
              NOUVELLE PARTIE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoninGame;