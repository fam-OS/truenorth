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

## Straggler items
- Add api tests for the new financial and team management data concepts 
- Update Readme to include data seeding instructions
- Fix reports to on Team Member detail page
- Saved goals not retained in database / on refresh 

## Fix Vercel deployment issue 

[10:02:26.872] Running build in Washington, D.C., USA (East) – iad1
[10:02:26.873] Build machine configuration: 4 cores, 8 GB
[10:02:26.906] Cloning github.com/fam-OS/truenorth (Branch: test, Commit: dea0274)
[10:02:27.113] Previous build caches not available
[10:02:28.101] Cloning completed: 1.194s
[10:02:28.626] Running "vercel build"
[10:02:29.071] Vercel CLI 46.0.3
[10:02:31.788] Installing dependencies...
[10:02:36.314] npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[10:02:36.542] npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[10:03:02.625] 
[10:03:02.625] added 833 packages in 31s
[10:03:02.626] 
[10:03:02.626] 186 packages are looking for funding
[10:03:02.626]   run `npm fund` for details
[10:03:02.711] Detected Next.js version: 15.4.5
[10:03:02.720] Running "npm run build"
[10:03:02.850] 
[10:03:02.850] > truenorth@0.1.0 build
[10:03:02.850] > next build
[10:03:02.850] 
[10:03:03.761] Attention: Next.js now collects completely anonymous telemetry regarding usage.
[10:03:03.762] This information is used to shape Next.js' roadmap and prioritize features.
[10:03:03.762] You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
[10:03:03.762] https://nextjs.org/telemetry
[10:03:03.762] 
[10:03:03.890]    ▲ Next.js 15.4.5
[10:03:03.890] 
[10:03:03.927]    Creating an optimized production build ...
[10:03:21.452]  ✓ Compiled successfully in 14.0s
[10:03:21.457]    Linting and checking validity of types ...
[10:03:26.743] 
[10:03:26.743] Failed to compile.
[10:03:26.743] 
[10:03:26.743] ./src/app/(dashboard)/business-units/page.tsx
[10:03:26.744] 17:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.744] 20:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.744] 21:10  Warning: 'selectedStakeholder' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[10:03:26.744] 21:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.744] 22:72  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.744] 27:10  Warning: 'isGoalModalOpen' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[10:03:26.744] 27:27  Warning: 'setIsGoalModalOpen' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[10:03:26.744] 28:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.744] 50:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.745] 51:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.745] 54:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.745] 54:72  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.745] 105:6  Warning: React Hook useEffect has missing dependencies: 'businessUnits.length' and 'fetchData'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[10:03:26.745] 117:18  Warning: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.745] 205:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.745] 216:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.745] 246:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.745] 
[10:03:26.745] ./src/app/(dashboard)/initiatives/[id]/page.tsx
[10:03:26.745] 3:21  Warning: 'useMemo' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.745] 29:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.745] 204:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.745] 
[10:03:26.745] ./src/app/(dashboard)/initiatives/page.tsx
[10:03:26.745] 11:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.745] 65:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.746] 
[10:03:26.746] ./src/app/(dashboard)/kpis/page.tsx
[10:03:26.746] 4:10  Warning: 'useEffect' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.746] 13:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.746] 108:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.746] 
[10:03:26.746] ./src/app/(dashboard)/ops-reviews/new/page.tsx
[10:03:26.746] 24:24  Warning: 'setIsSubmitting' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[10:03:26.747] 92:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.747] 167:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.747] 
[10:03:26.747] ./src/app/(dashboard)/ops-reviews/page.tsx
[10:03:26.747] 36:11  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.747] 40:11  Warning: 'FetchOpsReviewsParams' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.750] 59:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.751] 79:9  Warning: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[10:03:26.751] 80:9  Warning: 'queryClient' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[10:03:26.751] 
[10:03:26.752] ./src/app/(dashboard)/organizations/page.tsx
[10:03:26.752] 211:6  Warning: React Hook useEffect has a missing dependency: 'fetchOrganizations'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[10:03:26.752] 
[10:03:26.752] ./src/app/(dashboard)/page.tsx
[10:03:26.752] 346:9  Warning: 'topOrg' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[10:03:26.752] 578:84  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.753] 679:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.753] 
[10:03:26.753] ./src/app/(dashboard)/teams/[teamId]/page.tsx
[10:03:26.753] 21:9  Warning: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[10:03:26.753] 
[10:03:26.754] ./src/app/api/business-units/[businessUnitId]/goals/[goalId]/route.ts
[10:03:26.754] 5:6  Warning: 'GoalUpdateData' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.754] 
[10:03:26.754] ./src/app/api/initiatives/[id]/route.ts
[10:03:26.754] 31:74  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.755] 32:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.755] 
[10:03:26.755] ./src/app/api/initiatives/route.ts
[10:03:26.755] 38:74  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.755] 39:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.756] 
[10:03:26.756] ./src/app/api/kpis/[id]/route.ts
[10:03:26.756] 32:117  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.756] 33:9  Error: 'computed' is never reassigned. Use 'const' instead.  prefer-const
[10:03:26.762] 
[10:03:26.762] ./src/app/api/kpis/route.ts
[10:03:26.763] 22:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.763] 41:115  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.763] 
[10:03:26.763] ./src/app/api/ops-reviews/[id]/items/route.ts
[10:03:26.763] 2:10  Warning: 'Prisma' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.763] 8:11  Warning: 'OpsReviewItemResponse' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.764] 27:11  Warning: 'OpsReviewItem' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.764] 149:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.764] 
[10:03:26.764] ./src/app/api/ops-reviews/[id]/route.ts
[10:03:26.764] 32:92  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.764] 54:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.765] 81:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.765] 110:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.765] 173:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.765] 215:26  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.765] 
[10:03:26.765] ./src/app/api/stakeholders/[stakeholderId]/route.ts
[10:03:26.766] 30:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.766] 38:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.766] 
[10:03:26.766] ./src/app/api/teams/[teamId]/members/route.ts
[10:03:26.766] 37:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.766] 
[10:03:26.767] ./src/components/CEOGOALS.tsx
[10:03:26.767] 51:66  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[10:03:26.768] 
[10:03:26.768] ./src/components/GoalList.tsx
[10:03:26.769] 7:10  Warning: 'useState' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.769] 
[10:03:26.769] ./src/components/InitiativeForm.tsx
[10:03:26.769] 3:21  Warning: 'useMemo' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.769] 70:59  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.770] 89:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.770] 
[10:03:26.770] ./src/components/KpiForm.tsx
[10:03:26.770] 3:21  Warning: 'useMemo' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.770] 31:10  Warning: 'loading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[10:03:26.770] 
[10:03:26.771] ./src/components/OrganizationList.tsx
[10:03:26.771] 20:3  Warning: 'onSelectOrg' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.771] 
[10:03:26.771] ./src/components/StakeholderForm.tsx
[10:03:26.771] 16:35  Warning: 'businessUnit' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.771] 
[10:03:26.772] ./src/components/TaskForm.tsx
[10:03:26.772] 5:10  Warning: 'CreateTaskInput' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.772] 5:27  Warning: 'UpdateTaskInput' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.772] 
[10:03:26.772] ./src/components/TaskList.tsx
[10:03:26.772] 3:10  Warning: 'useState' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.773] 
[10:03:26.773] ./src/components/TeamEditForm.tsx
[10:03:26.773] 24:38  Warning: 'onSuccess' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.773] 24:49  Warning: 'onCancel' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.773] 
[10:03:26.773] ./src/components/ui/card.tsx
[10:03:26.774] 4:11  Error: An interface declaring no members is equivalent to its supertype.  @typescript-eslint/no-empty-object-type
[10:03:26.774] 
[10:03:26.774] ./src/components/ui/form.tsx
[10:03:26.774] 2:13  Warning: 'LabelPrimitive' is defined but never used.  @typescript-eslint/no-unused-vars
[10:03:26.774] 
[10:03:26.775] ./src/components/ui/input.tsx
[10:03:26.775] 5:18  Error: An interface declaring no members is equivalent to its supertype.  @typescript-eslint/no-empty-object-type
[10:03:26.775] 
[10:03:26.775] ./src/lib/prisma.ts
[10:03:26.775] 5:3  Warning: Unused eslint-disable directive (no problems were reported from 'no-var').
[10:03:26.775] 23:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.776] 30:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[10:03:26.776] 
[10:03:26.776] info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
[10:03:26.792] Error: Command "npm run build" exited with 1



## User experience
- Add user authentication to the app. Allow signups by email/password and Google signups. 
- Add a login page
- Add a user settings page.  User should should be able to update their name, email, password, and close account. 
- Add a logout button for logged in users
- Add a marketing landing page. The sub header should be: ROI Tracker and Team Management for Leaders at all levels

## Marketing pages
- Add a feature request form to the app
- Add a help page 
- Add a terms of service page
- Add a privacy policy page 

## Visualizations
- Stakeholder page: Visualize the org chart and way your org supports business units and initiatives feature.  
- Initiatives page:  Build a dynamic gannt chart based on the release date of initiatives, indicating which BU is supported. 

## Production preparedness

## Integrations
- Push email to the app (google, microsoft plugins?)
- Push calendar to the app (google, microsoft plugins?)
- Push documents to the app (google, microsoft plugins?)
- Push files to the app (google, microsoft plugins?)

Account Types determine experience:
- Individual 
- Organization
    -- Add company logo and CEO goals
    -- Add users to the organization 

Content of Ops Reviews:
- What makes an ops review successful? 
- What are the key metrics to measure the success of an ops review? 

What are we solving for?
- Share the CEO's strategic vision with leaders throughout the company. 
- Connect initiative bets to actual ROI results 
- Make it easy to measure success of teams at all levels and all disciplines 
- Connect company goals to people management strategies 
