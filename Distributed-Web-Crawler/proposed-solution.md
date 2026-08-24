# DCrawler

### Architecture
1. Get pre-seed links from excel sheet
2. read the

### Database
**`websites`**

| Key | Attribute | Type |
|---|---|---|
| PK | domain_name | String |
| SK | link | String |
| | content | JSON |
| | timestamp | Number |
| | is_explored | Boolean |


### Cloud Resource Configurations
1. EKS Cluster nodes 
    - memory = 1 GB
    - cpu = 1 vCPU
2. Each cluster will run 10 pods

### Tech Stack
1. Go routines


### Workers
1. Alpha Processor
    - Get the link from sqs
    - Explore sitemap.xml and internal links relavent to the root domain
    - Save it to the `websites` db

2. Beta Processor
    - Get root domain from `webistes` table
    - Start parsing raw html of each site
    - Update and save parsed data to `websites` db in batches

3. Gamma Publisher
    - Read pre-seeded sheet and publish to SQS.
    - 