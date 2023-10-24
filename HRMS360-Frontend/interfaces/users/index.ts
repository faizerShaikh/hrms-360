import { BaseObjInterface } from "..";


// "id": "06941186-78e5-4d59-8400-9dc690d74651",
// "name": "Channel Partner 1",
// "region": "Pune",
// "email": "channel.partner@apsis.com",
// "password": "$2a$10$6NymOWdsVpC18t2vKwO2v.0uiDYKHVEaXHYngZFBSumkL.QQvLa3O",
// "tenant_id": "36fe5064-fa26-449c-822d-310ac3a920fb",
// "createdAt": "2022-10-24T14:07:37.158Z",
// "updatedAt": "2022-10-24T14:07:37.176Z"

export interface UserInterface extends BaseObjInterface{
    name:string;
    region:string;
    email:string;
    password:string;
    tenant_id:string;
}