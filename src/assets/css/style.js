export const getRoleStyle = (role) => {
  switch (role) {
    case 'cleaning_service':
      return { bg: '#e0f2fe', text: '#0369a1' }; // Biru Muda
    case 'customer_service':
      return { bg: '#dcfce7', text: '#15803d' }; // Hijau
    case 'gardener':
      return { bg: '#fef9c3', text: '#a16207' }; // Kuning
    case 'security':
      return { bg: '#fee2e2', text: '#b91c1c' }; // Merah
    default:
      return { bg: '#f3f4f6', text: '#374151' }; // Abu-abu (Staf lain)
  }
};

export const getShiftStyle = (shift) => {
  switch (shift) {
    case 'pagi':
      return { bg: '#e0f2fe', text: '#0369a1' };
    case 'siang':
      return { bg: '#fee2e2', text: '#b91c1c' };
    default:
      return { bg: '#f3f4f6', text: '#374151' }; // Abu-abu (Staf lain)
  }
};
