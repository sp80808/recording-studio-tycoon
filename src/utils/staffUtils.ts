
export const getStaffStatusColor = (status: string) => {
  switch (status) {
    case 'Working': return 'text-green-400';
    case 'Resting': return 'text-blue-400';
    case 'Idle': return 'text-gray-400';
    default: return 'text-gray-400';
  }
};

export const getEnergyColor = (energy: number) => {
  if (energy > 60) return 'text-green-400';
  if (energy > 30) return 'text-yellow-400';
  return 'text-red-400';
};
