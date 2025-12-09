# Dublin Guide API Documentation

## Base URL
```
local :
http://localhost:8000/api/

deployed :
https://dublin-guide.onrender.com/
```

## Authentication
Add this header to protected requests:
```
Authorization: Token <your_token>
```

---

## Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register/` | Create new account | No |
| POST | `/auth/login/` | Login user | No |
| POST | `/auth/logout/` | Logout user | Yes |
| GET | `/auth/user/` | Get current user | Yes |
| POST | `/change-password/` | Change password | Yes |

---

## Places Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/places/` | List all places (with filters) | No |
| GET | `/places/<id>/` | Get place details | No |
| GET | `/places/nearby/` | Find nearby places | No |
| GET | `/categories/` | List categories | No |
| GET | `/areas/` | List areas | No |

**Filters for `/places/`:**
- `?category=1` - Filter by category
- `?child_friendly=true` - Child friendly only
- `?wheelchair_access=true` - Wheelchair accessible
- `?ordering=-popularity` - Sort by popularity

**For `/places/nearby/`:**
- `?lat=53.3498&lng=-6.2603&radius_km=5` - Required

---

## Ratings Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/places/<place_id>/ratings/` | Get place ratings | No |
| POST | `/places/<place_id>/ratings/create/` | Add rating | Yes |
| GET | `/ratings/<id>/` | Get single rating | No |
| PATCH | `/ratings/<id>/` | Update rating | Yes |
| DELETE | `/ratings/<id>/` | Delete rating | Yes |

**POST body:**
```json
{
  "stars": 5,
  "comment": "Great place!"
}
```

---

## Profile Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/profile/me/` | Get my profile | Yes |
| PATCH | `/users/<id>/` | Update profile | Yes |

---

## Favorites Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/favourites/` | List my favorites | Yes |
| POST | `/favourites/` | Add favorite | Yes |
| DELETE | `/favourites/<id>/` | Remove favorite | Yes |

**POST body:**
```json
{
  "place": 1
}
```

---

## Photos Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/photos/` | List photos | No |
| POST | `/photos/` | Upload photo | Yes |
| DELETE | `/photos/<id>/` | Delete photo | Yes |

**POST:** Use form data (multipart)
- `place` - Place ID (required)
- `image` - Image file (required)
- `caption` - Photo caption (optional)

---

## Itinerary Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/itineraries/` | List my itineraries | Yes |
| POST | `/itineraries/` | Create itinerary | Yes |
| GET | `/itineraries/<id>/` | Get itinerary details | Yes |
| PATCH | `/itineraries/<id>/` | Update itinerary | Yes |
| DELETE | `/itineraries/<id>/` | Delete itinerary | Yes |

---

## Itinerary Stops Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/itineraries/<itinerary_id>/stops/` | List stops | Yes |
| POST | `/itineraries/<itinerary_id>/stops/` | Add stop | Yes |
| GET | `/itinerarystops/<id>/` | Get stop details | Yes |
| PATCH | `/itinerarystops/<id>/` | Update stop | Yes |
| DELETE | `/itinerarystops/<id>/` | Delete stop | Yes |

**POST body:**
```json
{
  "order": 1,
  "place": 5,
  "arrival_time": "09:00:00",
  "departure_time": "11:00:00"
}
```

---

## Quick Examples

**Login:**
```
POST /api/auth/login/
{
  "username": "john",
  "password": "password123"
}
```

**Add to Favorites:**
```
POST /api/favourites/
Authorization: Token xyz123
{
  "place": 1
}
```

**Create Itinerary:**
```
POST /api/itineraries/
Authorization: Token xyz123
{
  "title": "Dublin Trip",
  "description": "3 days in Dublin"
}
```