import { createContext, useContext, useState, useEffect } from 'react'

const RestaurantContext = createContext()

export const useRestaurant = () => useContext(RestaurantContext)
export const useRestaurantContext = () => useContext(RestaurantContext)

export const RestaurantProvider = ({ children }) => {
  const [restaurants, setRestaurants] = useState([])
  const [activeRestaurant, setActiveRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)

  const selectRestaurant = (restaurant) => {
    setActiveRestaurant(restaurant)
    if (restaurant && restaurant._id) {
      localStorage.setItem('activeRestaurantId', restaurant._id)
    }
  }

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('/api/restaurants', {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.restaurants)) {
        setRestaurants(data.restaurants)
        
        const savedId = localStorage.getItem('activeRestaurantId')
        const found = savedId ? data.restaurants.find((r) => r._id === savedId) : null
        
        if (found) {
          setActiveRestaurant(found)
        } else if (data.restaurants.length > 0 && !activeRestaurant) {
          setActiveRestaurant(data.restaurants[0])
          localStorage.setItem('activeRestaurantId', data.restaurants[0]._id)
        }
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRestaurants()
  }, [])

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        setRestaurants,
        activeRestaurant,
        setActiveRestaurant: selectRestaurant,
        loading,
        fetchRestaurants,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  )
}