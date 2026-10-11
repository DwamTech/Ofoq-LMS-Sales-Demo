import { enterDemo, validatedStoredIdentity } from './demoGateway';
describe('verified demo session persistence',()=>{
  const fetchMock=jest.fn();
  const original=global.fetch;
  const user={id:1,name:'شخصية عرض',email:'student.demo@demo.ofoq.local',role:'student'};
  const reply=(data:unknown,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
  beforeEach(()=>{localStorage.clear();global.fetch=fetchMock;fetchMock.mockReset();});
  afterAll(()=>{global.fetch=original;});
  test('no stored token means no authenticated request',async()=>{expect(await validatedStoredIdentity()).toBeNull();expect(fetchMock).not.toHaveBeenCalled();});
  test('invalid token clears forged browser role',async()=>{localStorage.setItem('auth_token','synthetic-unit-fixture');localStorage.setItem('user_data',JSON.stringify({...user,role:'admin'}));fetchMock.mockResolvedValue(reply({},401));expect(await validatedStoredIdentity()).toBeNull();expect(localStorage.getItem('user_data')).toBeNull();});
  test('wrong role cannot persist or choose admin destination',async()=>{fetchMock.mockResolvedValue(reply({token:'synthetic-unit-fixture',user}));await expect(enterDemo('admin',new AbortController().signal)).rejects.toThrow('هوية');expect(localStorage.getItem('auth_token')).toBeNull();});
  test('real profile confirmation is required before persistence',async()=>{
    fetchMock.mockResolvedValueOnce(reply({token:'synthetic-unit-fixture',user,expires_at:new Date(Date.now()+1800000).toISOString()},201)).mockResolvedValueOnce(reply({user}));
    expect(await enterDemo('student',new AbortController().signal)).toBe('/user');expect(JSON.parse(localStorage.getItem('user_data')!).role).toBe('student');expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  test('a failed profile check never authenticates',async()=>{fetchMock.mockResolvedValueOnce(reply({token:'synthetic-unit-fixture',user},201)).mockResolvedValueOnce(reply({},401));await expect(enterDemo('student',new AbortController().signal)).rejects.toThrow();expect(localStorage.getItem('auth_token')).toBeNull();});
  test('backend failure never authenticates',async()=>{fetchMock.mockResolvedValue(reply({},503));await expect(enterDemo('student',new AbortController().signal)).rejects.toThrow();expect(localStorage.getItem('auth_token')).toBeNull();});
});
