import requests
r=requests.Session()
api='http://localhost:3006/login'
tkmk={
    'username':'student',
    'password':'student123'
}
res=r.post(url=api,data=tkmk)
print(res.status_code)
api_reg='http://localhost:3006/courses/register'
payl={
    'courseId':'4',
    'accessLevel':'admin'
}
res_reg=r.post(url=api_reg,data=payl)
print(res_reg.text)