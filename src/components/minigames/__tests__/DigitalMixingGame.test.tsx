import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DigitalMixingGame } from '../DigitalMixingGame';
import { useSound } from '@/hooks/useSound';

// Mock useSound hook
jest.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    playSound: jest.fn()
  })
}));

describe('DigitalMixingGame', () => {
  const mockOnComplete = jest.fn();
  const mockOnFail = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the game interface', () => {
    render(
      <DigitalMixingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Digital Mixing Challenge')).toBeInTheDocument();
    expect(screen.getByText('Start Mixing')).toBeInTheDocument();
  });

  it('starts the game when clicking start button', () => {
    render(
      <DigitalMixingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Mixing'));

    expect(screen.getByText('Time Remaining: 180s')).toBeInTheDocument();
    expect(screen.getByText('Kick')).toBeInTheDocument();
    expect(screen.getByText('Snare')).toBeInTheDocument();
    expect(screen.getByText('Hi-Hat')).toBeInTheDocument();
    expect(screen.getByText('Bass')).toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Pad')).toBeInTheDocument();
  });

  it('allows adjusting channel parameters', () => {
    render(
      <DigitalMixingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Mixing'));

    // Adjust fader
    const faderInput = screen.getAllByRole('slider')[0];
    fireEvent.change(faderInput, { target: { value: '0.5' } });
    expect(faderInput).toHaveValue('0.5');

    // Adjust pan
    const panInput = screen.getAllByRole('slider')[1];
    fireEvent.change(panInput, { target: { value: '-0.5' } });
    expect(panInput).toHaveValue('-0.5');

    // Adjust EQ
    const eqInputs = screen.getAllByRole('slider').slice(2, 5);
    fireEvent.change(eqInputs[0], { target: { value: '0.5' } });
    expect(eqInputs[0]).toHaveValue('0.5');

    // Adjust effects
    const effectInputs = screen.getAllByRole('slider').slice(5, 8);
    fireEvent.change(effectInputs[0], { target: { value: '0.3' } });
    expect(effectInputs[0]).toHaveValue('0.3');
  });

  it('handles mute and solo toggles', () => {
    render(
      <DigitalMixingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Mixing'));

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
      <DigitalMixingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Mixing'));

    // Fast-forward timer
    act(() => {
      jest.advanceTimersByTime(180000);
    });

    expect(mockOnComplete).toHaveBeenCalled();
    expect(screen.getByText(/Final Score:/)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('updates VU meters based on fader levels', () => {
    render(
      <DigitalMixingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Mixing'));

    // Set fader to 0.5
    const faderInput = screen.getAllByRole('slider')[0];
    fireEvent.change(faderInput, { target: { value: '0.5' } });

    // Check if VU meter reflects the fader level
    const vuMeter = screen.getByTestId('vu-meter');
    expect(vuMeter).toHaveStyle({ width: '50%' });
  });

  it('disables controls when channel is muted', () => {
    render(
      <DigitalMixingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Mixing'));

    // Mute the first channel
    const muteButton = screen.getAllByText('M')[0];
    fireEvent.click(muteButton);

    // Try to adjust fader
    const faderInput = screen.getAllByRole('slider')[0];
    fireEvent.change(faderInput, { target: { value: '0.5' } });
    expect(faderInput).toHaveValue('0');
  });

  it('plays sound effects on interactions', () => {
    const mockPlaySound = jest.fn();
    (useSound as jest.Mock).mockReturnValue({
      playSound: mockPlaySound
    });

    render(
      <DigitalMixingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    // Start game
    fireEvent.click(screen.getByText('Start Mixing'));
    expect(mockPlaySound).toHaveBeenCalledWith('start');

    // Mute channel
    const muteButton = screen.getAllByText('M')[0];
    fireEvent.click(muteButton);
    expect(mockPlaySound).toHaveBeenCalledWith('mute');

    // Solo channel
    const soloButton = screen.getAllByText('S')[0];
    fireEvent.click(soloButton);
    expect(mockPlaySound).toHaveBeenCalledWith('solo');
  });
});
