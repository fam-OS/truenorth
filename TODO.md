#TODO

##Phase 1 - Organizations, Stakeholders, and Business Units 
- Done

##Phase 2 - Teams
- Ability to add Team to an Organization from the organizations page    
- Ability to add Team Member to a Team from the teams page
- Ability to edit Team and Team Member from the teams page
- Ability to delete Team and Team Member from the teams page
- Ensure there are tests for teams and team members.  

##Phase 3 - Ops Reviews
- Add page in the navigation for "Ops Reviews"
- Add a data concept for Ops Reviews: Ops Review has a title, owner(=team member relationship), description, quarter, month, year, team (relationship)
- Add a data concept for Ops Review Items: Ops Review Item has a Title, owner(=team member relationship), description, target metric, actual metric, quarter, year, team (relationship) 

##Phase 4 - KPIs and Initiatives
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