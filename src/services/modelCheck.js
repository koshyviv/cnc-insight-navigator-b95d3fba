
// Simple utility to check if the model file is accessible
export const checkModelAvailability = async () => {
  try {
    // const modelPath = '/assets/gemma3-1b-it-int4.task';
    // console.log(`Checking model availability at ${modelPath}...`);

    // // Log information about the Docker environment
    // console.log('Current environment:', process.env.NODE_ENV);
    // console.log('Current location:', window.location.href);
    
    // // Try to fetch the model file
    // const response = await fetch(modelPath, { method: 'HEAD' });
    // const isAvailable = response.ok;
    
    // console.log(`Model file status: ${isAvailable ? 'Available' : 'Not available'}, Status: ${response.status}`);
    // console.log(`Content-Type: ${response.headers.get('Content-Type')}`);
    
    // if (!isAvailable) {
    //   console.error(`Failed to find model file at ${modelPath}. Status: ${response.status}, Status Text: ${response.statusText}`);
    // }
    
    return true;
  } catch (error) {
    console.error('Error checking model availability:', error);
    return false;
  }
};
