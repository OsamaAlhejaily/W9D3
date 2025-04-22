using Microsoft.AspNetCore.Mvc;

namespace ProductDashboard.Controllers
{
    public class ProductsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}