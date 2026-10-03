import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { gameAudio } from '@/utils/audioSystem';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { tc } from '@/i18n/content';

interface InstrumentTrack {
  id: string;
  name: string;
  type: 'drum' | 'bass' | 'guitar' | 'keys' | 'vocal' | 'strings';
  icon: string;
  color: string;
  frequency: number; // Frequency range for conflict detection
  timing: number; // -100 to 100 (early to late timing offset)
  volume: number; // 0 to 100
  pan: number; // -100 to 100 (left to right)
  isActive: boolean;
  conflicts: string[]; // Track IDs that conflict with this track
}

interface InstrumentLayeringGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  genre?: string;
}

export const InstrumentLayeringGame: React.FC<InstrumentLayeringGameProps> = ({
  onComplete,
  onClose,
  genre = 'rock'
}) => {
  const [tracks, setTracks] = useState<InstrumentTrack[]>([]);
  const [timeLeft, setTimeLeft] = useState(90);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  // Initialize tracks based on genre
  const initializeTracks = useCallback(() => {
    const baseTracksMap: { [key: string]: InstrumentTrack[] } = {
      rock: [
        { id: 'drums', name: 'Drums', type: 'drum', icon: '🥁', color: 'bg-red-500', frequency: 80, timing: 0, volume: 80, pan: 0, isActive: true, conflicts: [] },
        { id: 'bass', name: 'Bass Guitar', type: 'bass', icon: '🎸', color: 'bg-blue-500', frequency: 100, timing: 5, volume: 70, pan: -20, isActive: true, conflicts: [] },
        { id: 'rhythm', name: 'Rhythm Guitar', type: 'guitar', icon: '🎸', color: 'bg-orange-500', frequency: 400, timing: 0, volume: 60, pan: -40, isActive: false, conflicts: [] },
        { id: 'lead', name: 'Lead Guitar', type: 'guitar', icon: '🎸', color: 'bg-yellow-500', frequency: 800, timing: -2, volume: 65, pan: 40, isActive: false, conflicts: [] },
        { id: 'vocal', name: 'Lead Vocal', type: 'vocal', icon: '🎤', color: 'bg-purple-500', frequency: 1000, timing: 0, volume: 75, pan: 0, isActive: false, conflicts: [] },
        { id: 'keys', name: 'Keys/Piano', type: 'keys', icon: '🎹', color: 'bg-green-500', frequency: 500, timing: 0, volume: 50, pan: 20, isActive: false, conflicts: [] }
      ],
      pop: [
        { id: 'drums', name: 'Drums', type: 'drum', icon: '🥁', color: 'bg-red-500', frequency: 80, timing: 0, volume: 75, pan: 0, isActive: true, conflicts: [] },
        { id: 'bass', name: 'Bass', type: 'bass', icon: '🎸', color: 'bg-blue-500', frequency: 120, timing: 0, volume: 65, pan: 0, isActive: true, conflicts: [] },
        { id: 'keys', name: 'Synth/Keys', type: 'keys', icon: '🎹', color: 'bg-green-500', frequency: 600, timing: 0, volume: 55, pan: -30, isActive: false, conflicts: [] },
        { id: 'guitar', name: 'Electric Guitar', type: 'guitar', icon: '🎸', color: 'bg-orange-500', frequency: 800, timing: 0, volume: 50, pan: 30, isActive: false, conflicts: [] },
        { id: 'vocal', name: 'Lead Vocal', type: 'vocal', icon: '🎤', color: 'bg-purple-500', frequency: 1200, timing: 0, volume: 85, pan: 0, isActive: false, conflicts: [] },
        { id: 'harmony', name: 'Vocal Harmony', type: 'vocal', icon: '🎵', color: 'bg-pink-500', frequency: 1000, timing: 0, volume: 45, pan: -20, isActive: false, conflicts: [] }
      ],
      electronic: [
        { id: 'kick', name: 'Kick Drum', type: 'drum', icon: '🥁', color: 'bg-red-500', frequency: 60, timing: 0, volume: 85, pan: 0, isActive: true, conflicts: [] },
        { id: 'bass', name: 'Synth Bass', type: 'bass', icon: '🎛️', color: 'bg-blue-500', frequency: 80, timing: 0, volume: 80, pan: 0, isActive: true, conflicts: [] },
        { id: 'lead', name: 'Lead Synth', type: 'keys', icon: '🎹', color: 'bg-[var(--rst-brass-400)]', frequency: 1000, timing: 0, volume: 70, pan: 20, isActive: false, conflicts: [] },
        { id: 'pad', name: 'Synth Pad', type: 'strings', icon: '🌊', color: 'bg-indigo-500', frequency: 400, timing: 10, volume: 40, pan: 0, isActive: false, conflicts: [] },
        { id: 'arp', name: 'Arpeggiator', type: 'keys', icon: '🔄', color: 'bg-green-500', frequency: 800, timing: -5, volume: 50, pan: -40, isActive: false, conflicts: [] },
        { id: 'vocal', name: 'Vocal', type: 'vocal', icon: '🎤', color: 'bg-purple-500', frequency: 1200, timing: 0, volume: 60, pan: 0, isActive: false, conflicts: [] }
      ]
    };

    const genreTracks = baseTracksMap[genre.toLowerCase()] || baseTracksMap.rock;
    setTracks(genreTracks.map(track => ({ ...track })));
  }, [genre]);

  useEffect(() => {
    initializeTracks();
  }, [initializeTracks]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameCompleted(false);
    setScore(0);
    setTimeLeft(90);
    setFeedback('');
    setSelectedTrack(null);

    gameAudio.initialize();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const endGame = useCallback(() => {
    if (gameCompleted) return;
    
    setGameCompleted(true);
    const finalScore = calculateScore();
    setScore(finalScore);
    
    gameAudio.playCompleteProject();
    setTimeout(() => onComplete(finalScore), 1000);
  }, [gameCompleted, tracks]);

  const calculateScore = () => {
    const activeTracks = tracks.filter(t => t.isActive);
    
    if (activeTracks.length === 0) return 0;

    let arrangementScore = 0;
    let frequencyBalance = 0;
    let timingScore = 0;
    let volumeBalance = 0;
    let panningScore = 0;

    // Arrangement scoring - different genres need different track combinations
    const genreRules: { [key: string]: { required: string[], bonus: string[], penalties: string[] } } = {
      rock: {
        required: ['drums', 'bass'],
        bonus: ['rhythm', 'lead', 'vocal'],
        penalties: []
      },
      pop: {
        required: ['drums', 'bass', 'vocal'],
        bonus: ['keys', 'harmony'],
        penalties: []
      },
      electronic: {
        required: ['kick', 'bass'],
        bonus: ['lead', 'pad', 'arp'],
        penalties: []
      }
    };

    const rules = genreRules[genre.toLowerCase()] || genreRules.rock;
    
    // Check required tracks
    const hasRequiredTracks = rules.required.every(reqId => 
      activeTracks.some(t => t.id === reqId)
    );
    arrangementScore += hasRequiredTracks ? 30 : 0;

    // Bonus for good track combinations
    const bonusTracks = rules.bonus.filter(bonusId => 
      activeTracks.some(t => t.id === bonusId)
    );
    arrangementScore += bonusTracks.length * 10;

    // Frequency balance - avoid too many tracks in same frequency range
    const frequencyGroups: { [key: number]: number } = {};
    activeTracks.forEach(track => {
      const freqGroup = Math.floor(track.frequency / 200) * 200;
      frequencyGroups[freqGroup] = (frequencyGroups[freqGroup] || 0) + 1;
    });

    const maxConflicts = Math.max(...Object.values(frequencyGroups));
    frequencyBalance = Math.max(0, 30 - (maxConflicts - 1) * 10);

    // Timing scoring - slight variations are good, extreme timing is bad
    const timingVariations = activeTracks.map(t => Math.abs(t.timing));
    const avgTiming = timingVariations.reduce((a, b) => a + b, 0) / timingVariations.length;
    timingScore = Math.max(0, 25 - avgTiming);

    // Volume balance - avoid extreme volumes
    const volumes = activeTracks.map(t => t.volume);
    const volumeRange = Math.max(...volumes) - Math.min(...volumes);
    volumeBalance = Math.max(0, 30 - volumeRange / 3);

    // Panning distribution - avoid everything in center
    const panPositions = activeTracks.map(t => t.pan);
    const panSpread = Math.max(...panPositions) - Math.min(...panPositions);
    panningScore = Math.min(25, panSpread / 4);

    const totalScore = arrangementScore + frequencyBalance + timingScore + volumeBalance + panningScore;
    return Math.round(Math.min(150, totalScore)); // Cap at 150
  };

  const toggleTrack = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, isActive: !track.isActive }
        : track
    ));
    
    gameAudio.playClick();
    
    // Update score in real-time
    setTimeout(() => {
      const newScore = calculateScore();
      if (newScore > score) {
        setFeedback(tc('mg.InstrumentLayeringGame.fb_great', '📈 Great layering!'));
      } else if (newScore < score) {
        setFeedback(tc('mg.InstrumentLayeringGame.fb_check', '⚠️ Check your balance'));
      }
      setTimeout(() => setFeedback(''), 1500);
    }, 100);
  };

  const updateTrackParameter = (trackId: string, parameter: keyof InstrumentTrack, value: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, [parameter]: value }
        : track
    ));
  };

  const genreKey = ['rock', 'pop', 'electronic'].includes(genre.toLowerCase()) ? genre.toLowerCase() : 'rock';

  const getGenreHints = () => {
    const hints: { [key: string]: string[] } = {
      rock: [
        '🥁 Drums and bass are essential foundation',
        '🎸 Layer rhythm guitar before lead',
        '🎤 Vocals should sit on top of the mix',
        '⚖️ Balance guitar frequencies to avoid mud'
      ],
      pop: [
        '🎤 Vocals are the star - make them prominent',
        '🎹 Synths/keys fill harmonic space nicely',
        '🎵 Vocal harmonies add richness',
        '📍 Keep rhythm section tight and punchy'
      ],
      electronic: [
        '🔊 Kick and bass form the foundation',
        '🌊 Pads create atmosphere behind the lead',
        '🔄 Arpeggios add movement and interest',
        '⚡ Layer synths carefully to avoid frequency buildup'
      ]
    };
    return (hints[genre.toLowerCase()] || hints.rock).map((h, i) => tc(`mg.InstrumentLayeringGame.hint_${genreKey}_${i + 1}`, h));
  };

  if (!gameStarted) {
    return (
      <Card className="w-full max-w-6xl bg-stone-900 border-stone-600 p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">{tc('mg.InstrumentLayeringGame.title', '🎼 Instrument Layering Challenge')}</h2>
          <p className="text-stone-300">
            {tc('mg.InstrumentLayeringGame.intro', 'Create the perfect {{genre}} arrangement! Layer instruments thoughtfully, balance frequencies, and achieve a professional mix.', { genre })}
          </p>
          <div className="text-sm text-[var(--rst-live)] bg-white/[0.04] border border-[var(--rst-line)] p-4 rounded">
            <div className="font-semibold mb-2">{tc('mg.InstrumentLayeringGame.tips_heading', '💡 {{genre}} Tips:', { genre: genre.charAt(0).toUpperCase() + genre.slice(1) })}</div>
            <div className="space-y-1 text-left">
              {getGenreHints().map((hint, index) => (
                <div key={index}>{hint}</div>
              ))}
            </div>
          </div>
          <Button 
            onClick={startGame} 
            className="rst-btn rst-btn-primary text-lg px-8 py-3"
          >
            {tc('mg.InstrumentLayeringGame.start', 'Start Arranging')}
          </Button>
        </div>
      </Card>
    );
  }

  if (gameCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-stone-800 text-white border-stone-700">
        <MinigameChrome
          title={tc('mg.InstrumentLayeringGame.complete_title', '🎼 Arrangement Complete!')}
          score={score}
          accent="green"
        >
          <CardContent className="text-center space-y-4 py-6">
            <div className="space-y-2">
              <div className="text-sm text-stone-400">
                {tc('mg.InstrumentLayeringGame.result_line', 'Active Tracks: {{count}} | Genre: {{genre}}', { count: tracks.filter(t => t.isActive).length, genre })}
              </div>
              {score >= 120 && (
                <div className="text-green-400 font-bold text-xl mg-perfect-pop">{tc('mg.InstrumentLayeringGame.result_studio', '🎉 Studio-Quality Arrangement!')}</div>
              )}
              {score >= 80 && score < 120 && (
                <div className="text-[var(--rst-live)] font-bold mg-meter-glow">{tc('mg.InstrumentLayeringGame.result_pro', '👍 Professional Layering!')}</div>
              )}
              {score < 80 && (
                <div className="text-yellow-400 font-bold">{tc('mg.InstrumentLayeringGame.result_good', '📈 Good Foundation!')}</div>
              )}
            </div>
          </CardContent>
        </MinigameChrome>
        <DialogFooter className="p-4">
          <KenneyButton variant="green" onClick={onClose}>
            {tc('mg.InstrumentLayeringGame.collect', 'Collect Rewards')}
          </KenneyButton>
        </DialogFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-7xl mx-auto bg-stone-800 text-white border-stone-700">
      <MinigameChrome
        title={tc('mg.InstrumentLayeringGame.title', '🎼 Instrument Layering Challenge')}
        score={calculateScore()}
        timeLeft={timeLeft}
        accent="green"
      >
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-stone-300 text-sm">
              {tc('mg.InstrumentLayeringGame.genre_label', 'Genre:')} <span className="text-white font-semibold">{genre.charAt(0).toUpperCase() + genre.slice(1)}</span>
            </span>
            <span className="text-emerald-400 font-mono text-sm font-bold bg-emerald-950/60 px-3 py-1 rounded border border-emerald-800">
              {tc('mg.InstrumentLayeringGame.active_count', 'Active: {{n}}/{{total}}', { n: tracks.filter(t => t.isActive).length, total: tracks.length })}
            </span>
          </div>

          {feedback && (
            <div className="mb-4 text-center text-lg font-bold text-yellow-300 mg-combo-pulse">
              {feedback}
            </div>
          )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Track Selection */}
        <div className="xl:col-span-2">
          <h3 className="text-xl font-bold text-white mb-4">{tc('mg.InstrumentLayeringGame.tracks_heading', '🎵 Available Tracks')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.map(track => (
              <Card
                key={track.id}
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  track.isActive 
                    ? `${track.color} border-2 border-white` 
                    : 'bg-stone-700 border-stone-600 hover:bg-stone-600'
                }`}
                onClick={() => toggleTrack(track.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{track.icon}</span>
                    <div>
                      <div className="font-semibold text-white">{tc(`mg.InstrumentLayeringGame.track_${genreKey}_${track.id}`, track.name)}</div>
                      <div className="text-xs opacity-75">
                        {track.frequency}Hz | {tc(`mg.InstrumentLayeringGame.type_${track.type}`, track.type)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={track.isActive ? 'default' : 'outline'}>
                    {track.isActive ? tc('mg.InstrumentLayeringGame.on', 'ON') : tc('mg.InstrumentLayeringGame.off', 'OFF')}
                  </Badge>
                </div>

                {track.isActive && (
                  <div className="space-y-3 mt-4" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <div className="flex justify-between text-xs text-stone-300 mb-1">
                        <span>{tc('mg.InstrumentLayeringGame.volume', 'Volume')}</span>
                        <span>{track.volume}%</span>
                      </div>
                      <Slider
                        value={[track.volume]}
                        onValueChange={(value) => updateTrackParameter(track.id, 'volume', value[0])}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-stone-300 mb-1">
                        <span>{tc('mg.InstrumentLayeringGame.pan', 'Pan')}</span>
                        <span>{track.pan > 0 ? tc('mg.InstrumentLayeringGame.pan_r', 'R') : track.pan < 0 ? tc('mg.InstrumentLayeringGame.pan_l', 'L') : tc('mg.InstrumentLayeringGame.pan_c', 'C')}{Math.abs(track.pan)}</span>
                      </div>
                      <Slider
                        value={[track.pan]}
                        onValueChange={(value) => updateTrackParameter(track.id, 'pan', value[0])}
                        min={-100}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-stone-300 mb-1">
                        <span>{tc('mg.InstrumentLayeringGame.timing', 'Timing')}</span>
                        <span>{track.timing > 0 ? '+' : ''}{track.timing}ms</span>
                      </div>
                      <Slider
                        value={[track.timing]}
                        onValueChange={(value) => updateTrackParameter(track.id, 'timing', value[0])}
                        min={-50}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Mix Analysis */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">{tc('mg.InstrumentLayeringGame.mix_heading', '📊 Mix Analysis')}</h3>
          
          {/* Frequency Distribution */}
          <Card className="p-4 bg-stone-800 border-stone-600">
            <h4 className="font-semibold text-white mb-3">{tc('mg.InstrumentLayeringGame.freq_balance', 'Frequency Balance')}</h4>
            <div className="space-y-2">
              {['60-200Hz', '200-800Hz', '800-3kHz', '3kHz+'].map((range, index) => {
                const tracksInRange = tracks.filter(t => {
                  if (!t.isActive) return false;
                  const ranges = [[60, 200], [200, 800], [800, 3000], [3000, 20000]];
                  const [min, max] = ranges[index];
                  return t.frequency >= min && t.frequency < max;
                });
                
                return (
                  <div key={range} className="flex justify-between text-sm">
                    <span className="text-stone-300">{range}</span>
                    <span className={tracksInRange.length > 2 ? 'text-red-400' : 'text-green-400'}>
                      {tracksInRange.length === 1 ? tc('mg.InstrumentLayeringGame.tracks_one', '{{count}} track', { count: tracksInRange.length }) : tc('mg.InstrumentLayeringGame.tracks_other', '{{count}} tracks', { count: tracksInRange.length })}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Stereo Field */}
          <Card className="p-4 bg-stone-800 border-stone-600">
            <h4 className="font-semibold text-white mb-3">{tc('mg.InstrumentLayeringGame.stereo', 'Stereo Field')}</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-stone-400">{tc('mg.InstrumentLayeringGame.left', 'Left')}</div>
                <div className="text-[var(--rst-live)]">
                  {tracks.filter(t => t.isActive && t.pan < -20).length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-stone-400">{tc('mg.InstrumentLayeringGame.center', 'Center')}</div>
                <div className="text-green-400">
                  {tracks.filter(t => t.isActive && t.pan >= -20 && t.pan <= 20).length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-stone-400">{tc('mg.InstrumentLayeringGame.right', 'Right')}</div>
                <div className="text-[var(--rst-live)]">
                  {tracks.filter(t => t.isActive && t.pan > 20).length}
                </div>
              </div>
            </div>
          </Card>

          {/* Genre Guidelines */}
          <Card className="p-4 bg-white/[0.04] border border-[var(--rst-line)] border-[var(--rst-live)]/50">
            <h4 className="font-semibold text-[var(--rst-live)] mb-2">{tc('mg.InstrumentLayeringGame.guidelines', 'Genre Guidelines')}</h4>
            <div className="space-y-1 text-xs text-[var(--rst-ivory-soft)]">
              {getGenreHints().slice(0, 2).map((hint, index) => (
                <div key={index}>• {hint.replace(/[🎤🥁🎸🎹🎵📍🔊🌊🔄⚡]/gu, '')}</div>
              ))}
            </div>
          </Card>
        </div>
      </div>
        </CardContent>
      </MinigameChrome>
      <DialogFooter className="p-4">
        <KenneyButton variant="red" onClick={onClose}>
          {tc('mg.InstrumentLayeringGame.cancel', 'Cancel')}
        </KenneyButton>
        <KenneyButton
          variant="green"
          onClick={endGame}
          disabled={tracks.filter(t => t.isActive).length === 0}
        >
          {tc('mg.InstrumentLayeringGame.finish', 'Finish Arrangement')}
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
