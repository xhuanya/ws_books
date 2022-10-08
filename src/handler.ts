import { Router } from 'itty-router'
import { HttpError } from './Service/protocol';
import { RegisterRoute } from './Service/register';
import { WriteErrorHtml, throwError } from './Utils/httpHelper'

//基础路由
const router = Router();
/**
 * 处理请求
 * @param event 请求事件
 * @returns 响应
 */
export async function handleRequest(event: FetchEvent): Promise<Response> {
  RegisterRoute(router);
  router.all('/err', async () => {
    return new Response(`${test}`, { status: 200 });
  });
  //404路由
  router.all('*', () => { return new Response(WriteErrorHtml('404', 'NOT FOUND.'), { status: 404, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }) })
  let result = router.handle(event.request, event).catch((error: HttpError) => new Response(WriteErrorHtml('500', 'Server Error:' + error.message), { status: error.status || 500, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }));
  return result;
}