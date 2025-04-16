
// Simple utility to check if the model file is accessible
export const checkModelAvailability = async () => {
  try {
    const response = await fetch('/assets/gemma3-1b-it-int4.task', { method: 'HEAD' });
    const isAvailable = response.ok;
    console.log(`Model file status: ${isAvailable ? 'Available' : 'Not available'}, Status: ${response.status}`);
    return isAvailable;
  } catch (error) {
    console.error('Error checking model availability:', error);
    return false;
  }
};
