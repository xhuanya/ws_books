import { Router } from "itty-router";
import { Wsprotocol } from "./protocol";
import { WriteErrorHtml } from "../Utils/httpHelper";
import { CloseWebSocket, Join, MessageAnalysis } from "./ProcessCenter";
const indexHtml = require('./Index/html/index.html')
let Sockets: Array<WebSocket> = new Array<WebSocket>();
export async function RegisterRoute(router: Router<Request, any>) {
    router.get('/', async (rq: any, event: FetchEvent) => {

        return new Response(indexHtml.default, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    });
    /**
     * 监听ws
     */
    router.all('/ws', async (request: Request, event: FetchEvent) => {
        try {
            if (request.headers.get("Upgrade") == 'websocket') {
                let [client, server] = Object.values(new WebSocketPair());
                Sockets.push(server)
                await ListenerWs(server, event);
                return new Response(null, {
                    status: 101,
                    webSocket: client
                })
            }
            return new Response(WriteErrorHtml('500', 'GET 错误'), { status: 500, headers: { 'Content-Type': 'text/html; charset=UTF-8' } })
        } catch (error) {
            console.error('websocket错误', error)
        }
    })
}

async function ListenerWs(websocket: WebSocket, event: FetchEvent) {
    websocket.accept()
    Join(websocket)
    websocket.addEventListener("message", async ({ data }) => {
        let msgPro: Wsprotocol = JSON.parse(data.toString());
        MessageAnalysis(msgPro, websocket);

    })

    websocket.addEventListener("close", async evt => {
        // Handle when a client closes the WebSocket connection
        event.waitUntil(CloseWebSocket())
        console.log(evt)
    })
}