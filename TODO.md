#TODO

##Update 1 - Organizations, Stakeholders, and Business Units 
- Done

##Update 2 - Teams
- Done

##Update 3 - Ops Reviews
- Done 

##Update 3.1 - Enhancements and bug fixes to tasks, organizations, and teams  
- Done

##Update 3.2 - Bug fixes
- Check that Ops Reviews are being properly fetched.  I still do not see list of ops reviews displayed on the ops review page. 
- Fix "Failed to create goal" error  
 POST http://localhost:3000/api/business-units/cmen5aoz60000rpx8y2wwdq3i/goals 404 (Not Found)
handleCreateGoal	@	page.tsx:193
handleSubmit	@	GoalForm.tsx:38
<form>		
GoalForm	@	GoalForm.tsx:47
<GoalForm>		
renderContent	@	page.tsx:392
BusinessUnitsPage	@	page.tsx:544

 - Make sure we have tests for ops review and ops review items routes   

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
- Add a user profile page   
- Add a user settings page
- Add a marketing landing page

##Update 7 - Supporting pages
- Add a feedback form to the app
- Add a help page
- Add a terms of service page
- Add a privacy policy page

##Update 8 - 
- Visualize the way your org supports business units and initiatives feature 

Future Updates - 
- On the organization detail page, display a related list of teams and "Add Team" button. 
- On the team detail page, display a related list of team members and "Add Team Member" button.  