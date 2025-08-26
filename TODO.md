#TODO

##Update 1 - Organizations, Stakeholders, and Business Units 
- Done

##Update 2 - Teams
- Done

##Update 3 - Ops Reviews
- Done 

##Update 3.1 - Enhancements and bug fixes to tasks, organizations, and teams  
- Done

##Update 3.2 - Ops Review Item bug fixes 
- Done

##Update 3.3 - Goal bugfixes 
- Done

##Update 3.3 - Company information and API tests
- Task: Make sure we have tests for ops review and ops review items routes 

##Update 3.4 - Reports to relationships
- Task: Update Readme with data model diagram.
- Task: Add a "Reports to" (relationship) field to the Stakeholder table, and point to a Stakeholder Id.
- Task: Add a "Reports to" (relationship) field to the Team Member table, and point to a Team Member Id.

##Update 4 - KPIs and Initiatives 
- Add an Initiative data concept: name, one line summary, value proposition, implementation details, owner(=team member relationship), release date, organization (relationship) 
- Add a KPI data concept: KPIs have name, team (relationship), target metric, actual metric, quarter, year, organization (relationship) 
- KPIs are tied to a Business Unit (relationship) and an Initiative (relationship), so create a junction table for this relationship
- Display a list of KPIs on the Initiative page and the Business Unit page          

##Update 5 - Executive Dashboard 
- Add a nav item called "Value Tracker" that points to a new page 
- "Value Tracker" is an executive dashboard with 
- Metrics include: 
-- ability to select a quarter and year 
-- a list of Initiatives by Business Unit by release month 
-- a list of KPIs for the selected quarter and year for each Initiative and Business Unit and their actual vs target values 
-- a list of Ops Reviews for the selected quarter and year and Ops Review Items with their actual vs target values  

##Update 6 - User authentication
- Add user authentication to the app
- Add a user registration page
- Add a login page
- Add a logout button

##Update 6.1 - User profile and settings
- Add a user profile page   
- Add a user settings page
- Add a marketing landing page 

##Update 7 - Marketing pages
- Add a feedback form to the app
- Add a help page
- Add a terms of service page
- Add a privacy policy page 

##Update 8 - Visualizations
- Visualize the org chart and way your org supports business units and initiatives feature 

Future Updates - 
- Add an IsActive field to the TeamMember table 
- On the organization detail page, display a related list of teams and "Add Team" button. 
- On the team detail page, display a related list of team members and "Add Team Member" button.  