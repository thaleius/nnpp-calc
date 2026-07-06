const range = 'B18:B19';
const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vS92rySf5971fG16pRx7EcDuAXkuU__EQIxW5aKRkAKgv3FJ4hf1EFnw5y03JWP75Bzz5stV53F9SgI/pub?gid=1022868083&single=true&output=csv&range=${range}`;

export const getConstants = async () => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return (await response.text()).split('\n').map(v => Number(v));
};