import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WaveformSculpting } from '../WaveformSculpting';
import { TARGET_SOUNDS } from '../WaveformSculpting';

describe('WaveformSculpting', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders initial game state correctly', () => {
    render(<WaveformSculpting />);
    
    expect(screen.getByText('Waveform Sculpting')).toBeInTheDocument();
    expect(screen.getByText('Time: 3:00')).toBeInTheDocument();
    expect(screen.getByText('Score: 0')).toBeInTheDocument();
    expect(screen.getByText('Accuracy: 0%')).toBeInTheDocument();
    expect(screen.getByText('Start Game')).toBeInTheDocument();
  });

  it('starts game when Start Game button is clicked', () => {
    render(<WaveformSculpting />);
    
    fireEvent.click(screen.getByText('Start Game'));
    
    expect(screen.getByText('End Game')).toBeInTheDocument();
    expect(screen.getByText('Add Sine')).toBeInTheDocument();
    expect(screen.getByText('Add Square')).toBeInTheDocument();
    expect(screen.getByText('Add Triangle')).toBeInTheDocument();
  });

  it('adds a new layer when Add Sine button is clicked', () => {
    render(<WaveformSculpting />);
    
    fireEvent.click(screen.getByText('Start Game'));
    fireEvent.click(screen.getByText('Add Sine'));
    
    expect(screen.getByText('sine')).toBeInTheDocument();
  });

  it('updates layer parameters when sliders are adjusted', () => {
    render(<WaveformSculpting />);
    
    fireEvent.click(screen.getByText('Start Game'));
    fireEvent.click(screen.getByText('Add Sine'));
    
    const frequencySlider = screen.getByLabelText('Frequency');
    fireEvent.change(frequencySlider, { target: { value: '2' } });
    
    expect(frequencySlider).toHaveValue('2');
  });

  it('removes layer when Remove button is clicked', () => {
    render(<WaveformSculpting />);
    
    fireEvent.click(screen.getByText('Start Game'));
    fireEvent.click(screen.getByText('Add Sine'));
    
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('sine')).not.toBeInTheDocument();
  });

  it('changes target sound when a new sound is selected', () => {
    render(<WaveformSculpting />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: TARGET_SOUNDS[1].id } });
    
    expect(screen.getByText(TARGET_SOUNDS[1].description)).toBeInTheDocument();
  });

  it('updates timer correctly', () => {
    render(<WaveformSculpting />);
    
    fireEvent.click(screen.getByText('Start Game'));
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(screen.getByText('Time: 2:59')).toBeInTheDocument();
  });

  it('ends game when timer reaches zero', () => {
    render(<WaveformSculpting />);
    
    fireEvent.click(screen.getByText('Start Game'));
    
    act(() => {
      jest.advanceTimersByTime(180000); // 3 minutes
    });
    
    expect(screen.getByText('Start Game')).toBeInTheDocument();
  });

  it('toggles layer enabled state when switch is clicked', () => {
    render(<WaveformSculpting />);
    
    fireEvent.click(screen.getByText('Start Game'));
    fireEvent.click(screen.getByText('Add Sine'));
    
    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    
    expect(switchElement).not.toBeChecked();
  });

  it('displays target sound layers correctly', () => {
    render(<WaveformSculpting />);
    
    expect(screen.getByText('Target Sound Layers')).toBeInTheDocument();
    expect(screen.getByText(TARGET_SOUNDS[0].layers[0].type)).toBeInTheDocument();
  });
}); 