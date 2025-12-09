# DublinGuide

Name: Demetry Reece-Okic
Student Number: C21474374


## Link to deployment
https://dublin-guide.onrender.com/

## Architecture:

Frontend: Vite + React
Backend: Django + DjangoREST framework
Database: PostgresSQL + PostGIS
Deployment: Docker + Render

## Description of Project:
Dublin guide is a web application for tourists visiting dublin, it includes web mapping features which allow tourists to save routes, view popular tourist destinations. These destinations can be sorted through filters such as favourites,category,accessability,nearby in a radius,in specific area. Places can be favourited, rated and the tourist can add pictures to places they have visited. Tourist can also select places and create their own itenerary and view how much it will cost and how long it will take.

## Planned Feautures(before devlopment) include:
Account related features:
Authentication(admin account can use crud on places to manage data through frontend).
Tourist creates account
Website shows account info
Potententially can show places that have been visited(optional feature)
Places can be marked with points and once you visit them you can gain points and earn rewards(very optional)

User(Tourist) features:
1. Tourist sees places to visit on map.
2. There are a wide range of places such as cafe,restaurant,museum,activities,famous places etc.
3. Each place is uniquely seperated by visual differences of the markers on the map.
4. Each place holds info about price,popularity(how many other users visited),ratings,time it takes up
5. Tourist can select how many people are travelling and it will filter places suited for x amount of people
6. Tourist can input a budget to give the best route based on the budget.
7. Tourist can input the amount of time they have and it can give the best route.
8. The budget, amount of time, amount of people they have can be filtered at the same time to generate the best route
9. When generating the route it will draw a line to each place with a starting point and end point
10. It will show when to leave each place and when to arrive at another place
11. Can have checkbox to filter whether you want to include places to eat(will add place to eat breakfast,lunch,dinner in middle of route based on time of day if checkbox is ticked)
12. Tourist can filter places near them
13. Tourist can filter places by areas(polygons)
14. Tourist can favourite places and give ratings
15. Filter checkbox for child friendly
16. Filter checkbox for wheelchair access
17. User Location Tracking (Live GPS)
18. Generate a Full Dynamic Itinerary (Route Planner)
19. Heatmap of popular attractions(optional)
20. Cluster map markers(Clustering of map markers)
21. Travel Mode Filtering(walking,driving)
22. User Analytics (admin-only)
23. Deploy the Backend with Docker + Cloud (azure)
24. Tourist can add photos from place they visited(stored on profile)


## Actual Features Implemented:
1. Login/SignUp using django auth tokens
2. React Side bar containing different pages for navigation
3. Places viewable on map with custom markers for each category of place
4. Filtering to show different places
5. Favourite Places, viewable on favourites page along with place details
6. Show nearby places
7. Show places in an area
8. Generate directions using leaflet routing machine
9. Itenerary page which allows user to create itenerary with multiple stops,pricing,time it takes.
10. Gallery page to show photos uploaded to each place from the main map page
11. Users can rate places if they select a place on the map, also view other ratings
12. Account page with crud options for users account, also shows some stats
13. Light and dark mode theme changeable in sidebar and login/signup pages
14. Database is dockerised locally but uses renders database for deployment
15. PWA using service worker to server offline + vite pwa to add option to download website locally
16. Backend + Frontend deployed together to render
17. Frontend is built during deployment using Vite+React with npm run build
18. Backend Django serves the built frontend files
19. Django admin configured to have access to make quick edits in django admin
20. Github used for version control and for Automated deployment(connected to render auto deploys commits)

# Screenshots of deployed system:


## Main map page:
![alt text](image-1.png)

## Main map page light mode:
![alt text](image-13.png)

## Filters selected:
![alt text](image-2.png)

## Filter by area
![alt text](image-5.png)

## Directions:
![alt text](image-3.png)

## Add Photo:
![alt text](image-4.png)

## Places modal:
![alt text](image-6.png)

## Add Rating
![alt text](image-7.png)

## Itinerary page
![alt text](image-9.png)

## View saved Itinerary
![alt text](image-10.png)

## Favourites page
![alt text](image-8.png)

## Gallery page
![alt text](image-11.png)

## Account page
![alt text](image-12.png)

## Login Page
![alt text](image-14.png)

## Signup Page
![alt text](image-15.png)

## Offline mode 
![alt text](image.png)

## PWA
![alt text](1000026173.jpg)
![alt text](1000026176.jpg)

## Mobile view
![alt text](1000026177.jpg)
![alt text](1000026178.jpg)