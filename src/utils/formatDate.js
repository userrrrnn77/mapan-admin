/**
 * Format tanggal ke Indonesia (Contoh: 3 Februari 2024)
 * @param {string} dateString - ISO Date dari MongoDB
 */
export const formatTanggalIndo = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

/**
 * Format Jam (Contoh: 08:30)
 */
export const formatJam = (dateString) => {
  if (!dateString) return '--:--';
  const date = new Date(dateString);
  return date
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace('.', ':');
};

/**
 * Gabungan (Contoh: 3 Feb 2024, 08:30)
 */
export const formatLengkap = (dateString) => {
  if (!dateString) return '-';
  return `${formatTanggalIndo(dateString)}, ${formatJam(dateString)} WIB`;
};
