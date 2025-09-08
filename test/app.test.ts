const request = require('supertest');
const app = require('../index'); // ../index.jsからappをインポート

describe('GET /', () => {
  it('should return 200 OK and render the index page', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    // レスポンスのContent-Typeがtext/htmlであることを確認
    expect(res.headers['content-type']).toMatch(/text\/html/);
    // レスポンスのbodyに特定の文言が含まれているか確認
    expect(res.text).toContain('御朱印めぐり');
  });
});
