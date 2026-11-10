"""Bounded, single-worker throttling for public authentication endpoints."""
import os,time
from collections import OrderedDict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class ProductionGuard(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.buckets=OrderedDict()

    async def dispatch(self,request,call_next):
        limits={'/api/auth/login':(30,60),'/api/auth/register':(10,3600)}
        if os.getenv('FINPILOT_ENV')=='production' and request.method=='POST' and request.url.path in limits:
            maximum,period=limits[request.url.path]
            client=request.client.host if request.client else 'unknown'
            key=(client,request.url.path);now=time.monotonic()
            start,count=self.buckets.pop(key,(now,0))
            if now-start>=period:start,count=now,0
            self.buckets[key]=(start,count+1)
            while len(self.buckets)>10000:self.buckets.popitem(last=False)
            if count>=maximum:
                return JSONResponse({'detail':'操作过于频繁，请稍后重试'},status_code=429,headers={'Retry-After':str(max(1,int(period-(now-start))))})
        return await call_next(request)
