import axios from 'axios';
import * as XLSX from 'xlsx';

const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vS92rySf5971fG16pRx7EcDuAXkuU__EQIxW5aKRkAKgv3FJ4hf1EFnw5y03JWP75Bzz5stV53F9SgI/pub?gid=1022868083&single=true&output=xlsx`;

export const getConstants = async () => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const workbook = XLSX.read(response.data, { type: 'buffer' });
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const C1 = worksheet['B18'] ? worksheet['B18'].v : 6.5339266918944;
  const dC1 = worksheet['C18'] ? worksheet['C18'].v : 0.00168020096940957;
  const C2 = worksheet['B19'] ? worksheet['B19'].v : 0.0355548898570974;
  const dC2 = worksheet['C19'] ? worksheet['C19'].v : 0.00015220331982137;

  return {
    C1,
    dC1,
    C2,
    dC2
  };
};