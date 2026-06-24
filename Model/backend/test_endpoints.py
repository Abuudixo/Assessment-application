import requests
base='http://127.0.0.1:8000'
print('health', requests.get(base+'/health').json())
# register
r = requests.post(base+'/auth/register', json={'email':'test@example.com','password':'testpass','name':'Test User'})
print('register', r.status_code, r.json())
# login
r2 = requests.post(base+'/auth/login', json={'email':'test@example.com','password':'testpass'})
print('login', r2.status_code, r2.json())
token = r2.json().get('access_token')
headers={'Authorization':f'Bearer {token}'}
# predict
answers={f'q{i}':0 for i in range(1,26)}
r3 = requests.post(base+'/predict', json=answers, headers=headers)
print('predict', r3.status_code, r3.json())
# save assessment
r4 = requests.post(base+'/assessments', json={'answers':answers}, headers=headers)
print('save', r4.status_code, r4.json())
# list assessments
r5 = requests.get(base+'/assessments', headers=headers)
print('list', r5.status_code, r5.json())
