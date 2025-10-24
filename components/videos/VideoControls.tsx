import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Pressable } from 'react-native';
import { AVPlayerManager, PlayerState } from '@/hooks/videos/AVPlayerManager';
import { useScale } from '@/hooks/useScale';

interface VideoControlsProps {
  playerManager: AVPlayerManager;
  playerState: PlayerState;
}

export const VideoControls: React.FC<VideoControlsProps> = ({ playerManager, playerState }) => {
  const styles = useStyles();
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls after 3 seconds of no interaction
  useEffect(() => {
    if (!showControls) return;

    const timer = setTimeout(() => {
      if (!playerState.isPaused) {
        setShowControls(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, playerState.isPaused]);

  // Show controls when paused
  useEffect(() => {
    if (playerState.isPaused) {
      setShowControls(true);
    }
  }, [playerState.isPaused]);

  const handleScreenPress = () => {
    setShowControls(!showControls);
  };

  const handlePlayPause = () => {
    if (playerState.isPaused) {
      playerManager.play();
    } else {
      playerManager.pause();
    }
    setShowControls(true);
  };

  const handleSeek = (seconds: number) => {
    const newPosition = Math.max(0, Math.min(playerState.position + seconds, playerState.duration));
    playerManager.seek(newPosition);
    setShowControls(true);
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = playerState.duration > 0 ? playerState.position / playerState.duration : 0;

  return (
    <Pressable style={styles.container} onPress={handleScreenPress}>
      {showControls && (
        <View style={styles.controlsOverlay}>
          {/* Center Play/Pause Button */}
          <View style={styles.centerControls}>
            <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause} activeOpacity={0.8}>
              <Text style={styles.playPauseIcon}>{playerState.isPaused ? '▶' : '❚❚'}</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(playerState.position)}</Text>
                <Text style={styles.timeText}>{formatTime(playerState.duration)}</Text>
              </View>
            </View>

            {/* Seek Buttons */}
            <View style={styles.seekButtons}>
              <TouchableOpacity style={styles.seekButton} onPress={() => handleSeek(-10)} activeOpacity={0.8}>
                <Text style={styles.seekText}>-10s</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.seekButton} onPress={() => handleSeek(10)} activeOpacity={0.8}>
                <Text style={styles.seekText}>+10s</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.seekButton} onPress={() => handleSeek(30)} activeOpacity={0.8}>
                <Text style={styles.seekText}>+30s</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const useStyles = () => {
  const scale = useScale();

  return StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
    },
    controlsOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'space-between',
    },
    centerControls: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playPauseButton: {
      width: 80 * scale,
      height: 80 * scale,
      borderRadius: 40 * scale,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    playPauseIcon: {
      fontSize: 32 * scale,
      color: '#000',
      marginLeft: 4 * scale, // Slight offset for play icon to look centered
    },
    bottomControls: {
      padding: 20 * scale,
      paddingBottom: 30 * scale,
    },
    progressContainer: {
      marginBottom: 15 * scale,
    },
    progressBar: {
      height: 4 * scale,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 2 * scale,
      overflow: 'hidden',
      marginBottom: 8 * scale,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#ff0000',
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    timeText: {
      color: '#ffffff',
      fontSize: 14 * scale,
      fontWeight: '500',
    },
    seekButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 15 * scale,
    },
    seekButton: {
      paddingHorizontal: 20 * scale,
      paddingVertical: 12 * scale,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8 * scale,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    seekText: {
      color: '#ffffff',
      fontSize: 16 * scale,
      fontWeight: '600',
    },
  });
};
