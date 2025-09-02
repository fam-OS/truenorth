#TODO

## Update 1 - Organizations, Stakeholders, and Business Units 
- Done
## Update 2 - Teams
- Done
## Update 3 - Ops Reviews
- Done 
## Update 3.1 - Enhancements and bug fixes to tasks, organizations, and teams  
- Done
## Update 3.2 - Ops Review Item bug fixes 
- Done
## Update 3.3 - Goal bugfixes 
- Done
## Update 3.3 - Company information and API tests
- Done
## Update 3.4 - Fix unit tests
- Done
## Reports to relationships, Improvements to Team Member detail and Business Units pages 
- Done
## Home nav changes 
- Done  
## KPIs and Initiatives 
- Done       
## Value Tracker on Home
- Done
## Bugs / Tasks 
- Done
## Nav cleanup 
- Done
## Headcount Manager:
- Done
## Financial Tracker 
- Done 
## User experience
- Done
## Marketing pages
- Done 
## Production preparedness
- Done 
## CompanyAccount
- Done

## Fixes and improvements
- Create / update / delete organization 

@web-context:console-logs failed to create team from organization detail page 

- Fix Add founder on company account page 
- Fix Select private or public on company account page 
- fix Update company account
Error: Failed to update company account
    at createConsoleError (http://localhost:3000/_next/static/chunks/node_modules_next_dist_445d8acf._.js:1484:71)
    at handleConsoleError (http://localhost:3000/_next/static/chunks/node_modules_next_dist_445d8acf._.js:2090:54)
    at console.error (http://localhost:3000/_next/static/chunks/node_modules_next_dist_445d8acf._.js:2243:57)
    at handleSaveOverview (http://localhost:3000/_next/static/chunks/src_708da3b2._.js:657:25)


- Create / update / delete goals 
- Create / update / delete initiatives 
- Create / update / delete teams 
- Create / update / delete business units  
- Create / update / delete stakeholders 
- Create / update / delete team members 
- Create / update / delete ops reviews 
- Create / update / delete ops review items 
- Create / update / delete kpis  

- If company is not created yet, highlight the "Create organization" item on the dashboard to do list by making the other items dimmed out. 
- Add section on Initiative Detail titled, "Impacted Business Unit Goals", with list of Goals related to that Initiative. Display which business unit it is tied to (visual indicator?)  
- Add help text for adding new organization "Business Ops, Servicing, Technology..."  
- Add Multi-factor auth 
- Update Dashboard components:
    - Business units with goals 
    - Initiatives by Status with KPI
    - Team health 

## Features
- Team member 1:1s: Date, Team Member, Notes, Tasks[] 
    - Create 1:1 
    - Edit 1:1
    - Delete 1:1
    - List 1:1s
    - View 1:1 detail
- On team member and stakeholder detail pages, add a related list for "1:1s" with button for "Create 1:1".  The list should display related 1:1s if any exist, and point to the detail page for that 1:1 record.  The detail page for the 1:1s record should have an Edit and Delete button.  
- See basic org chart to team page
- See basic timeline view to initiative page 
- Export team manager to CSV 
- Export budget ledger to CSV 
- Basic reporting engine for stakeholders 
 
Content of Ops Reviews:
- What makes an ops review successful? 
- What are the key metrics to measure the success of an ops review? 

What are we solving for?
- Keep relationship notes in one place for discussions with directs, higher ups, and stakeholders
- Maintain a personal source of truth for the executive strategic vision and business goals to meet this vision 
- Model your team's budget and recurring costs, and model and forecast headcount for your organization  
- Track overall status of key initiatives and KPIs they are tied to 
- Make it easy to measure success of teams at all levels and all disciplines  
- Connect company goals to people management strategies  
- Track high level goals and metrics for a company business unit 


