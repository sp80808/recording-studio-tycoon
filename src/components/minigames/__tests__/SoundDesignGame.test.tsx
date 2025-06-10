import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SoundDesignGame } from '../SoundDesignGame';

// Mock useSound hook
jest.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    playSound: jest.fn()
  })
}));

// Mock AudioContext
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    type: '',
    frequency: { value: 0 },
    detune: { value: 0 },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn()
  })),
  createBiquadFilter: jest.fn(() => ({
    type: '',
    frequency: { value: 0 },
    Q: { value: 0 },
    connect: jest.fn()
  })),
  createBuffer: jest.fn(() => ({
    length: 0,
    sampleRate: 44100,
    numberOfChannels: 2
  })),
  destination: {}
};

global.AudioContext = jest.fn(() => mockAudioContext);

describe('SoundDesignGame', () => {
  const mockOnComplete = jest.fn();
  const mockOnFail = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the game interface', () => {
    render(
      <SoundDesignGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Sound Design Challenge')).toBeInTheDocument();
    expect(screen.getByText('Start Designing')).toBeInTheDocument();
  });

  it('starts the game when clicking start button', () => {
    render(
      <SoundDesignGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Designing'));

    expect(screen.getByText('Time Remaining: 300s')).toBeInTheDocument();
    expect(screen.getByText('Score: 0')).toBeInTheDocument();
  });

  it('allows changing synthesis method', () => {
    render(
      <SoundDesignGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Designing'));

    const fmButton = screen.getByText('fm');
    fireEvent.click(fmButton);
    expect(fmButton).toHaveClass('bg-primary');
  });

  it('allows changing sound category', () => {
    render(
      <SoundDesignGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Designing'));

    const foleyButton = screen.getByText('foley');
    fireEvent.click(foleyButton);
    expect(foleyButton).toHaveClass('bg-primary');
  });

  it('allows adjusting synthesis parameters', () => {
    render(
      <SoundDesignGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Designing'));

    const frequencyInput = screen.getByLabelText('Frequency');
    fireEvent.change(frequencyInput, { target: { value: '880' } });
    expect(frequencyInput).toHaveValue('880');

    const filterInput = screen.getByLabelText('Filter Frequency');
    fireEvent.change(filterInput, { target: { value: '2000' } });
    expect(filterInput).toHaveValue('2000');
  });

  it('allows adjusting effect parameters', () => {
    render(
      <SoundDesignGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Designing'));

    const reverbInput = screen.getByLabelText('Reverb');
    fireEvent.change(reverbInput, { target: { value: '0.5' } });
    expect(reverbInput).toHaveValue('0.5');

    const delayInput = screen.getByLabelText('Delay');
    fireEvent.change(delayInput, { target: { value: '0.3' } });
    expect(delayInput).toHaveValue('0.3');
  });

  it('plays and stops sound when clicking play button', () => {
    render(
      <SoundDesignGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Designing'));

    const playButton = screen.getByText('Play Sound');
    fireEvent.click(playButton);
    expect(screen.getByText('Stop')).toBeInTheDocument();

    // Fast-forward 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Play Sound')).toBeInTheDocument();
  });

  it('completes the game after timer runs out', () => {
    jest.useFakeTimers();

    render(
      <SoundDesignGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start Designing'));

    // Fast-forward timer
    act(() => {
      jest.advanceTimersByTime(300000);
    });

    expect(mockOnComplete).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('plays sound effects on interactions', () => {
    const mockPlaySound = jest.fn();
    const mockUseSound = jest.fn().mockReturnValue({
      playSound: mockPlaySound
    });
    
    // Mock the hook for this specific test
    jest.doMock('@/hooks/useSound', () => ({
      useSound: mockUseSound
    }));

    render(
      <SoundDesignGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    // Start game
    fireEvent.click(screen.getByText('Start Designing'));
    expect(mockPlaySound).toHaveBeenCalledWith('start');

    // Change synthesis method
    const fmButton = screen.getByText('fm');
    fireEvent.click(fmButton);
    expect(mockPlaySound).toHaveBeenCalledWith('select');

    // Change sound category
    const foleyButton = screen.getByText('foley');
    fireEvent.click(foleyButton);
    expect(mockPlaySound).toHaveBeenCalledWith('select');

    // Adjust parameters
    const frequencyInput = screen.getByLabelText('Frequency');
    fireEvent.change(frequencyInput, { target: { value: '880' } });
    expect(mockPlaySound).toHaveBeenCalledWith('parameter');

    // Adjust effects
    const reverbInput = screen.getByLabelText('Reverb');
    fireEvent.change(reverbInput, { target: { value: '0.5' } });
    expect(mockPlaySound).toHaveBeenCalledWith('effect');
  });
});
