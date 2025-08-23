#TODO

##Phase 1 - Organizations, Stakeholders, and Business Units 
- Done

##Phase 2 - Teams
- Done

##Phase 3 - Ops Reviews
- Done

##Phase 4 - KPIs and Initiatives
- Cleanup: remove empty element above list element on business-units page.  Make the list design cohesive across business units and organizations pages.
- Add an Initiative data concept: name, one line summary, value proposition, implementation details, owner(=team member relationship), release date, organization (relationship) 
- Add a KPI data concept: KPIs have name, team (relationship), target metric, actual metric, quarter, year, organization (relationship) 
- KPIs are tied to a Business Unit (relationship) and an Initiative (relationship), so create a junction table for this relationship
- Display a list of KPIs on the Initiative page and the Business Unit page          

##Phase 5 - Executive Dashboard 
- Add a nav item called "Value Tracker" that points to a new page 
- "Value Tracker" is an executive dashboard with 
- Metrics include: 
-- ability to select a quarter and year 
-- a list of Initiatives by Business Unit by release month 
-- a list of KPIs for the selected quarter and year for each Initiative and Business Unit and their actual vs target values 
-- a list of Ops Reviews for the selected quarter and year and Ops Review Items with their actual vs target values  

##Phase 6 - User authentication
- Add user authentication to the app
- Add a login page
- Add a logout button
- Add a user profile page   