import { useState, useEffect } from 'react';

const useDataFetching = (url, initialState) => {
  const [data, setData] = useState(initialState);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data from ${url}`);
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
      }
    };

    fetchData();
  }, [url]);

  return data;
};

export default useDataFetching;
