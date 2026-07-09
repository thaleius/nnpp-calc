import axios from 'axios';
import * as XLSX from 'xlsx';

const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vS92rySf5971fG16pRx7EcDuAXkuU__EQIxW5aKRkAKgv3FJ4hf1EFnw5y03JWP75Bzz5stV53F9SgI/pub?gid=1022868083&single=true&output=xlsx`;

export const getConstants = async () => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const workbook = XLSX.read(response.data, { type: 'buffer' });
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const C1 = worksheet['B18'] ? worksheet['B18'].v : 6.53421059705648;
  const dC1 = worksheet['C18'] ? worksheet['C18'].v : 0.00152124083139595;
  const C2 = worksheet['B19'] ? worksheet['B19'].v : 0.0355533450133021;
  const dC2 = worksheet['C19'] ? worksheet['C19'].v : 0.000147356683340934;
  const C3 = worksheet['B20'] ? worksheet['B20'].v : 5499;
  const dC3 = worksheet['C20'] ? worksheet['C20'].v : 0;
  const C4 = worksheet['B21'] ? worksheet['B21'].v : 1519.10957783;
  const dC4 = worksheet['C21'] ? worksheet['C21'].v : 24.5949707;
  const C5 = worksheet['B22'] ? worksheet['B22'].v : 2816.98830942;
  const dC5 = worksheet['C22'] ? worksheet['C22'].v : 11.75458032;

  return {
    C1,
    dC1,
    C2,
    dC2,
    C3,
    dC3,
    C4,
    dC4,
    C5,
    dC5
  };
};