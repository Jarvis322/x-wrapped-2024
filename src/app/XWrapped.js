const fetchTwitterData = async (username) => {
  setLoading(true);
  setError(null);
  
  try {
    console.log('Fetching data for username:', username);
    const response = await fetch(`/api/twitter/user?username=${encodeURIComponent(username)}`);
    console.log('API Response status:', response.status);
    
    const data = await response.json();
    console.log('API Response data:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Twitter verilerini alırken bir hata oluştu');
    }

    setTwitterData(data);
  } catch (error) {
    console.error('Error fetching Twitter data:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
}; 