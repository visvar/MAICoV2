export default function get(){
    return{
    port: process.env.PORT || 3000,
    mongoURI: "mongodb+srv://admin:VGGmhAEDZj4D@aicomposition.ssxufuu.mongodb.net/AIComposition?retryWrites=true&w=majority",
    }
}