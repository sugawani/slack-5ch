export class IDCounter {
    constructor(private readonly state: DurableObjectState) {}
    async fetch(_request: Request): Promise<Response> {
        const id: number = await this.state.storage?.get("id") || 0;
        await this.state.storage?.put("id", id+1)

        return new Response(id.toString());
    }   
}
