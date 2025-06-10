import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalogConsoleGame } from '../AnalogConsoleGame';
import { useSound } from '@/hooks/useSound';

// Mock the useSound hook
jest.mock('@/hooks/useSound', () => ({
  useSound: jest.fn(() => ({
    playSound: jest.fn()
  }))
}));

describe('AnalogConsoleGame', () => {
  const mockOnComplete = jest.fn();
  const mockOnFail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the game interface', () => {
    render(
      <AnalogConsoleGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    expect(screen.getByText('Analog Console Challenge')).toBeInTheDocument();
    expect(screen.getByText('Time Remaining: 60s')).toBeInTheDocument();
    expect(screen.getByText('Start Mixing')).toBeInTheDocument();
  });

  it('starts the game when clicking the start button', () => {
    render(
      <AnalogConsoleGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    const startButton = screen.getByText('Start Mixing');
    fireEvent.click(startButton);

    expect(screen.queryByText('Start Mixing')).not.toBeInTheDocument();
    expect(screen.getByText('Kick')).toBeInTheDocument();
    expect(screen.getByText('Snare')).toBeInTheDocument();
    expect(screen.getByText('Hi-Hat')).toBeInTheDocument();
  });

  it('allows adjusting channel parameters', () => {
    render(
      <AnalogConsoleGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    // Start the game
    fireEvent.click(screen.getByText('Start Mixing'));

    // Find and adjust a fader
    const fader = screen.getAllByLabelText('Fader')[0];
    fireEvent.change(fader, { target: { value: '0.5' } });
    expect(fader).toHaveValue('0.5');

    // Find and adjust pan
    const pan = screen.getAllByLabelText('Pan')[0];
    fireEvent.change(pan, { target: { value: '-0.5' } });
    expect(pan).toHaveValue('-0.5');

    // Find and adjust EQ
    const lowEQ = screen.getAllByLabelText('Low')[0];
    fireEvent.change(lowEQ, { target: { value: '0.3' } });
    expect(lowEQ).toHaveValue('0.3');
  });

  it('allows adjusting effects sends', () => {
    render(
      <AnalogConsoleGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    // Start the game
    fireEvent.click(screen.getByText('Start Mixing'));

    // Find and adjust reverb
    const reverb = screen.getAllByLabelText('Reverb')[0];
    fireEvent.change(reverb, { target: { value: '0.7' } });
    expect(reverb).toHaveValue('0.7');

    // Find and adjust delay
    const delay = screen.getAllByLabelText('Delay')[0];
    fireEvent.change(delay, { target: { value: '0.4' } });
    expect(delay).toHaveValue('0.4');

    // Find and adjust compression
    const compression = screen.getAllByLabelText('Comp')[0];
    fireEvent.change(compression, { target: { value: '0.6' } });
    expect(compression).toHaveValue('0.6');
  });

  it('handles mute and solo toggles', () => {
    render(
      <AnalogConsoleGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    // Start the game
    fireEvent.click(screen.getByText('Start Mixing'));

    // Find and click mute button
    const muteButton = screen.getAllByText('M')[0];
    fireEvent.click(muteButton);
    expect(muteButton).toHaveClass('bg-destructive');

    // Find and click solo button
    const soloButton = screen.getAllByText('S')[0];
    fireEvent.click(soloButton);
    expect(soloButton).toHaveClass('bg-primary');
  });

  it('completes the game after time runs out', () => {
    jest.useFakeTimers();

    render(
      <AnalogConsoleGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    // Start the game
    fireEvent.click(screen.getByText('Start Mixing'));

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(mockOnComplete).toHaveBeenCalled();
    expect(screen.getByText(/Final Score:/)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('disables controls when channel is muted', () => {
    render(
      <AnalogConsoleGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    // Start the game
    fireEvent.click(screen.getByText('Start Mixing'));

    // Mute the first channel
    const muteButton = screen.getAllByText('M')[0];
    fireEvent.click(muteButton);

    // Check if controls are disabled
    const fader = screen.getAllByLabelText('Fader')[0];
    const pan = screen.getAllByLabelText('Pan')[0];
    const lowEQ = screen.getAllByLabelText('Low')[0];
    const reverb = screen.getAllByLabelText('Reverb')[0];

    expect(fader).toBeDisabled();
    expect(pan).toBeDisabled();
    expect(lowEQ).toBeDisabled();
    expect(reverb).toBeDisabled();
  });

  it('plays sound effects on interactions', () => {
    const mockPlaySound = jest.fn();
    (useSound as jest.Mock).mockReturnValue({ playSound: mockPlaySound });

    render(
      <AnalogConsoleGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    // Start the game
    fireEvent.click(screen.getByText('Start Mixing'));
    expect(mockPlaySound).toHaveBeenCalledWith('start');

    // Click mute
    const muteButton = screen.getAllByText('M')[0];
    fireEvent.click(muteButton);
    expect(mockPlaySound).toHaveBeenCalledWith('mute');

    // Click solo
    const soloButton = screen.getAllByText('S')[0];
    fireEvent.click(soloButton);
    expect(mockPlaySound).toHaveBeenCalledWith('solo');
  });

  it('updates VU meters based on fader level', () => {
    jest.useFakeTimers();

    render(
      <AnalogConsoleGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    // Start the game
    fireEvent.click(screen.getByText('Start Mixing'));

    // Set fader level
    const fader = screen.getAllByLabelText('Fader')[0];
    fireEvent.change(fader, { target: { value: '0.5' } });

    // Fast-forward time to allow VU meter updates
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Check if VU meter is rendered
    const vuMeter = screen.getAllByRole('presentation')[0];
    expect(vuMeter).toBeInTheDocument();

    jest.useRealTimers();
  });
}); 