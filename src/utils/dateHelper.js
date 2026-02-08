export const getPeriodeSekarang = () => {
  const now = new Date();
  const tgl = now.getDate();
  const bln = now.getMonth();
  const thn = now.getFullYear();

  let start, end;

  if (tgl >= 7) {
    // Periode: 7 Bulan Ini - 6 Bulan Depan
    start = new Date(thn, bln, 7, 0, 0, 0);
    end = new Date(thn, bln + 1, 6, 23, 59, 59);
  } else {
    // Periode: 7 Bulan Lalu - 6 Bulan Ini
    start = new Date(thn, bln - 1, 7, 0, 0, 0);
    end = new Date(thn, bln, 6, 23, 59, 59);
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    label: `${start.toLocaleDateString('id-ID')} s/d ${end.toLocaleDateString('id-ID')}`,
  };
};
