
// Simple utility to check if the model file is accessible
export const checkModelAvailability = async () => {
  try {
    console.log('Checking model availability at /assets/gemma3-1b-it-int4.task...');
    const response = await fetch('/assets/gemma3-1b-it-int4.task', { method: 'HEAD' });
    const isAvailable = response.ok;
    console.log(`Model file status: ${isAvailable ? 'Available' : 'Not available'}, Status: ${response.status}`);
    
    if (!isAvailable) {
      console.error(`Failed to find model file. Status: ${response.status}, Status Text: ${response.statusText}`);
    }
    
    return isAvailable;
  } catch (error) {
    console.error('Error checking model availability:', error);
    return false;
  }
};
