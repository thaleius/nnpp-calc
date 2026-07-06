const range = 'B18:B19';
const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vS92rySf5971fG16pRx7EcDuAXkuU__EQIxW5aKRkAKgv3FJ4hf1EFnw5y03JWP75Bzz5stV53F9SgI/pub?gid=1022868083&single=true&output=csv&range=${range}`;

export const getConstants = async () => {
  try {
    const response = await fetch(url);
    console.log('Constants loaded successfully.')
    return (await response.text()).split('\n').map(v => Number(v));
  } catch (error) {
    console.warn('Failed to load constants. Using predefined constants instead.')
    return [391.213071072183, 5.31730933886138];
  }
};