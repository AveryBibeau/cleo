import { doSomething } from '##/client/util'
import '../styles/main.scss'

document.addEventListener('DOMContentLoaded', function () {
  let foo: string = 'bar'
  console.log('Loaded client side script', foo)
  console.log(doSomething())
})


