const range = 'B18:C19';
const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vS92rySf5971fG16pRx7EcDuAXkuU__EQIxW5aKRkAKgv3FJ4hf1EFnw5y03JWP75Bzz5stV53F9SgI/pub?gid=1022868083&single=true&output=csv&range=${range}`;

export const getConstants = async () => {
  try {
    const response = await fetch(url);
    console.log('Constants loaded successfully.')
    return (await response.text()).split('\n').map(v => v.split(',').map(vv => Number(vv)));
  } catch (error) {
    console.warn('Failed to load constants. Using predefined constants instead.')
    return [[6.5339266918725], [0.0355548898587525]];
  }
};