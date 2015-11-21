# antenna
> Nexters 1:1 music recommend app

&nbsp;

## Back-end Technology Stack
  
- Language : Javascript
- Framework : [Node.js](https://nodejs.org/), [Express](http://expressjs.com/)
- Test Server : [AWS EC2](http://aws.amazon.com/ko/ec2/), [Nginx](http://nginx.org/) 
- Database : MariaDB(MySQL OpenSource)

## REST API 
> REST API Definition

| Feature |	Method	| Request URL | Todo Status | Date (yymmdd) |
| :------------ |	:-------:	| :-----------------| :--------: | :----: |
| TEST |	POST	| /antenna/test/connect | complete | 15-10-03  |
| USER Join |	POST	| /antenna/user | complete | 15-10-08  |
| Estimate Song List |	GET	| /antenna/estimate | complete | 15-10-31  |
| Estimate Song Result |	POST	| /antenna/estimate | complete | 15-11-08  |
| Estimate Match |	POST	| /antenna/estimate/match | complete | 15-11-13  |
| Estimate Detail |	GET	| /antenna/estimate/match | complete | 15-11-22  |