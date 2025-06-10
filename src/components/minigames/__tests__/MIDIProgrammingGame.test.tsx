import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MIDIProgrammingGame } from '../MIDIProgrammingGame';
import * as useSoundModule from '@/hooks/useSound';

// Mock useSound hook
jest.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    playSound: jest.fn()
  })
}));

describe('MIDIProgrammingGame', () => {
  const mockOnComplete = jest.fn();
  const mockOnFail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the game interface', () => {
    render(
      <MIDIProgrammingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    expect(screen.getByText('MIDI Programming Challenge')).toBeInTheDocument();
    expect(screen.getByText('Start Programming')).toBeInTheDocument();
  });

  it('starts the game when clicking start button', () => {
    render(
      <MIDIProgrammingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    fireEvent.click(screen.getByText('Start Programming'));

    expect(screen.getByText('Time Remaining: 120s')).toBeInTheDocument();
    expect(screen.getByText('Bass')).toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Pad')).toBeInTheDocument();
    expect(screen.getByText('Drums')).toBeInTheDocument();
  });

  it('allows placing and removing notes', () => {
    render(
      <MIDIProgrammingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    fireEvent.click(screen.getByText('Start Programming'));

    // Place a note
    const firstStep = screen.getAllByRole('button')[0];
    fireEvent.click(firstStep);
    expect(screen.getByText('Notes: C4')).toBeInTheDocument();

    // Remove the note
    fireEvent.click(firstStep);
    expect(screen.queryByText('Notes: C4')).not.toBeInTheDocument();
  });

  it('handles mute and solo toggles', () => {
    render(
      <MIDIProgrammingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    fireEvent.click(screen.getByText('Start Programming'));

    // Toggle mute
    const muteButton = screen.getAllByText('M')[0];
    fireEvent.click(muteButton);
    expect(muteButton).toHaveClass('bg-destructive');

    // Toggle solo
    const soloButton = screen.getAllByText('S')[0];
    fireEvent.click(soloButton);
    expect(soloButton).toHaveClass('bg-primary');
  });

  it('completes the game after timer runs out', () => {
    jest.useFakeTimers();

    render(
      <MIDIProgrammingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    fireEvent.click(screen.getByText('Start Programming'));

    // Fast-forward timer
    act(() => {
      jest.advanceTimersByTime(120000);
    });

    expect(mockOnComplete).toHaveBeenCalled();
    expect(screen.getByText(/Final Score:/)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('disables controls when track is muted', () => {
    render(
      <MIDIProgrammingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    fireEvent.click(screen.getByText('Start Programming'));

    // Mute the first track
    const muteButton = screen.getAllByText('M')[0];
    fireEvent.click(muteButton);

    // Try to place a note
    const firstStep = screen.getAllByRole('button')[0];
    fireEvent.click(firstStep);
    expect(screen.queryByText('Notes: C4')).not.toBeInTheDocument();
  });

  it('plays sound effects on interactions', () => {
    const mockPlaySound = jest.fn();
    jest.spyOn(useSoundModule, 'useSound').mockReturnValue({
      playSound: mockPlaySound,
      stopSound: jest.fn(),
      toggleMute: jest.fn(),
      isMuted: false
    });

    render(
      <MIDIProgrammingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    // Start game
    fireEvent.click(screen.getByText('Start Programming'));
    expect(mockPlaySound).toHaveBeenCalledWith('start');

    // Place note
    const firstStep = screen.getAllByRole('button')[0];
    fireEvent.click(firstStep);
    expect(mockPlaySound).toHaveBeenCalledWith('note');

    // Mute track
    const muteButton = screen.getAllByText('M')[0];
    fireEvent.click(muteButton);
    expect(mockPlaySound).toHaveBeenCalledWith('mute');

    // Solo track
    const soloButton = screen.getAllByText('S')[0];
    fireEvent.click(soloButton);
    expect(mockPlaySound).toHaveBeenCalledWith('solo');
  });

  it('updates VU meters based on note velocity', () => {
    render(
      <MIDIProgrammingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    fireEvent.click(screen.getByText('Start Programming'));

    // Place a note with high velocity
    const firstStep = screen.getAllByRole('button')[0];
    fireEvent.click(firstStep);

    // Check if VU meter reflects the note
    const vuMeter = screen.getByTestId('vu-meter');
    expect(vuMeter).toHaveStyle({ height: '80%' });
  });
});
